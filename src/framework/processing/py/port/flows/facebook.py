import json
import pandas as pd
import zipfile
import os
# import port.api.props as props # Not strictly needed if common.py handles all prop creation
from .common import (
    render_page, 
    validate_the_participants_input, 
    extract_files_metadata, 
    generate_consent_prompt, 
    get_file_contents, 
    donate_files, 
    generate_retry_prompt,
    generate_file_prompt
)

facebook_patterns = [
    '.*ad_preferences.json', 
    ".*advertisers_using_your_activity_or_information.json"
]

def extract_ad_preferences(ad_pref_dict) -> pd.DataFrame:
    ad_interests_entities = [field for field in ad_pref_dict['label_values'] if 'title' in field.keys() and field['title'] == 'Ads interests'][0].get('dict')
    ad_interests = [ent.get('dict')[0]['value'] for ent in ad_interests_entities]
    return pd.DataFrame(sorted(ad_interests), columns=["Ad Preferences"])

def tabulate_ad_preferences(zip_file: str) -> pd.DataFrame:
    """
    Function that extracts the desired statistics
    """
    out = pd.DataFrame()

    try:
        file = zipfile.ZipFile(zip_file)
        for name in file.namelist():
            info = file.getinfo(name)
            if (name.endswith('ad_preferences.json')):
                with file.open(name) as json_file:
                    ad_pref_dict = json.load(json_file)
                    out = extract_ad_preferences(ad_pref_dict)

    except Exception as e:
        print(f"Something went wrong: {e}")

    return out

def extract_advertisers(zip_file: str) -> pd.DataFrame:
    """
    Function that extracts the advertisers using your activity or information
    """
    out = pd.DataFrame()

    try:
        file = zipfile.ZipFile(zip_file)
        for name in file.namelist():
            if (name.endswith('advertisers_using_your_activity_or_information.json')):
                with file.open(name) as json_file:
                    advertiser_dict = json.load(json_file)
                    advertisers_entities = advertiser_dict['custom_audiences_all_types_v2']
                    columns = ['Advertiser Name', 'Has Data File Custom Audience', 'Has Remarketing Custom Audience', 'Has In Person Store Visit']
                    result = pd.DataFrame(advertisers_entities)
                    result.columns = columns
                    out = result.sort_values(by='Advertiser Name')

    except Exception as e:
        print(f"Something went wrong: {e}")

    return out

def facebook_flow(session_id: str, config: dict):
    title = "Facebook Ad Information Donation"
    
    # Ask the participant to submit a file
    file_prompt = generate_file_prompt("file_upload_prompt.md", "application/zip, text/plain")
    file_prompt_result = yield render_page(title, file_prompt)
    
    # If the participant submitted a file: continue
    if file_prompt_result.__type__ == 'PayloadString':

        # Validate the file the participant submitted
        # In general this is wise to do
        zip_file = file_prompt_result.value
        is_data_valid = validate_the_participants_input(zip_file, facebook_patterns)

        # Happy flow:
        # The file the participant submitted is valid
        if is_data_valid == True:

            # Extract the data you as a researcher are interested in, and put it in a pandas DataFrame
            # Show this data to the participant in a table on screen
            # The participant can now decide to donate
            files_metadata = extract_files_metadata(zip_file, facebook_patterns)
            ad_preferences = tabulate_ad_preferences(zip_file)
            advertisers = extract_advertisers(zip_file)
            # consent_prompt = generate_consent_prompt(extracted_data_statistics, extracted_advertisers)
            consent_prompt = generate_consent_prompt(files_metadata, ad_preferences, advertisers)
            consent_prompt_result = yield render_page(title, consent_prompt)

            # If the participant wants to donate the data gets donated
            if consent_prompt_result.__type__ == "PayloadJSON":
                print('consent_prompt_result')
                print(consent_prompt_result.value)
                # Convert value to a dictionary
                result_value = json.loads(consent_prompt_result.value)
                print(result_value)
                print(result_value[0])
                print(result_value[0]['zip_contents_0'])
                submitted_files = result_value[0]['zip_contents_0']
                filenames = [file['File name'] for file in submitted_files]
                # Extract the zip and save the files into an "file-output" folder
                blobs = get_file_contents(zip_file, filenames)
                yield donate_files(f"{session_id}", blobs)
                # yield donate(f"{session_id}-{platform}", consent_prompt_result.value)

            return

        # Sad flow:
        # The data was not valid, ask the participant to retry
        if is_data_valid == False:
            retry_prompt = generate_retry_prompt(title)
            retry_prompt_result = yield render_page(title, retry_prompt)

            # The participant wants to retry: start from the beginning
            if retry_prompt_result.__type__ == 'PayloadTrue':
                yield from facebook_flow(session_id, config)
            # The participant does not want to retry or pressed skip
            else:
                return

    # The participant did not submit a file and pressed skip
    else:
        return
