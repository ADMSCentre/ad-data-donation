import port.api.props as props
from port.api.commands import (CommandSystemDonate, CommandUIRender, CommandSystemExit, CommandSystemDonateFiles)
from pyodide.http import open_url

import pandas as pd
import json
import zipfile
import regex
import os

patterns = [
    '.*ad_preferences.json', 
    ".*advertisers_you've_interacted_with.json", 
    ".*advertisers_using_your_activity_or_information.json"
]

def get_prompt_for_language(markdown_path: str, language: str) -> str:
    base_url = os.environ.get("PUBLIC_URL", "")    
    try:
        url = f"{base_url}/prompts/{language}/{markdown_path}"
        res = open_url(url)
        value = res.getvalue()
    except:
        value = f"No translation found for {language}"
    return value

def get_translatable_prompt(markdown_path: str) -> props.Translatable:
    languages = props.Translations.__required_keys__
    translatable = {
        language: get_prompt_for_language(markdown_path, language)
        for language in languages
    }
    return props.Translatable(translatable)

def extract_files_metadata(zip_file: str) -> pd.DataFrame:
    """
    This function extracts the data the researcher is interested in

    In this case we extract from the zipfile:
    * The file names
    * The compressed file size
    * The file size

    You could extract anything here
    """
    out = pd.DataFrame()

    try:
        file = zipfile.ZipFile(zip_file)
        data = []
        for name in file.namelist():
            # Exclude files that are not of interest
            if not any(regex.match(pattern, name) for pattern in patterns):
                continue
            info = file.getinfo(name)
            data.append((name, info.compress_size, info.file_size))

        out = pd.DataFrame(data, columns=["File name", "Compressed file size", "File size"])

    except Exception as e:
        print(f"Something went wrong: {e}")

    return out


def validate_the_participants_input(zip_file: str) -> bool:
    """
    Check if the participant actually submitted a zipfile
    Returns True if participant submitted a zipfile, otherwise False

    In reality you need to do a lot more validation.
    Some things you could check:
    - Check if the the file(s) are the correct format (json, html, binary, etc.)
    - If the files are in the correct language
    """

    try:
        with zipfile.ZipFile(zip_file) as zf:
            # Ensure the pattern matches at least one file
            if not any(regex.match(pattern, name) for pattern in patterns for name in zf.namelist()):
                return False
            return True
    except zipfile.BadZipFile:
        return False


def render_end_page():
    """
    Renders a thank you page
    """
    page = props.PropsUIPageEnd()
    return CommandUIRender(page)


def render_page(platform: str, body):
    """
    Renders the UI components
    """
    header = props.PropsUIHeader(props.Translatable({"en": platform, "nl": platform }))
    footer = props.PropsUIFooter()
    page = props.PropsUIPageDonation(platform, header, body, footer)
    return CommandUIRender(page)


def generate_retry_prompt(platform: str) -> props.PropsUIPromptConfirm:
    text = get_translatable_prompt("retry.md")
    ok = props.Translatable({
        "en": "Try again",
        "nl": "Probeer opnieuw"
    })
    cancel = props.Translatable({
        "en": "Continue",
        "nl": "Verder"
    })
    return props.PropsUIPromptConfirm(text, ok, cancel)


def generate_file_prompt(description_public_path, extensions) -> props.PropsUIPromptFileInput:
    # description = props.Translatable({
    #     "en": f"Please follow the **download instructions** and choose the file that you stored on your device. Click “Skip” at the right bottom, if you do not have a {platform} file. ",
    #     "nl": f"Volg de download instructies en kies het bestand dat u opgeslagen heeft op uw apparaat. Als u geen {platform} bestand heeft klik dan op “Overslaan” rechts onder."
    # })
    # Load description from public folder
    description = get_translatable_prompt(description_public_path)
    return props.PropsUIPromptFileInput(description, extensions)

def generate_consent_prompt(*args: pd.DataFrame) -> props.PropsUIPromptConsentForm:
    description = get_translatable_prompt("consent_form.md")

    donate_question = props.Translatable({
       "en": "Do you want to share this data for research?",
       "nl": "Wilt u deze gegevens delen voor onderzoek?"
    })

    donate_button = props.Translatable({
       "en": "Yes, share for research",
       "nl": "Ja, deel voor onderzoek"
    })

    table_titles = [
        props.Translatable({
            "en": f"The contents of your zipfile (only the files we are interested in)",
        }),
        props.Translatable({
            "en": f"Your ad preference list",
        }),
        props.Translatable({
            "en": f"Advertisers using your activity or information",
        }),
    ]
    
    wordcloud = dict(
        title = dict(en= "Ad Preferences"),
        type = "wordcloud",
        textColumn = 'Ad Preferences',
        tokenize = False,
    )
    
    visualisations = [
        [],
        [],
        []
    ] 

    tables = [] 
    for index, df in enumerate(args):
        table_title = table_titles[index]
        vis = visualisations[index]
        tables.append(props.PropsUIPromptConsentFormTable(f"zip_contents_{index}", title=table_title, data_frame=df, visualizations=vis))

    return props.PropsUIPromptConsentForm(
       tables,
       [],
       description = description,
       donate_question = donate_question,
       donate_button = donate_button
    )


def donate(key, json_string):
    return CommandSystemDonate(key, json_string)

def donate_files(key, file_contents):
    return CommandSystemDonateFiles(key, file_contents)

def exit_port(code, info):
    return CommandSystemExit(code, info)


##################################################################################
# Exercise for the reader

# Add an extra table to the output
# This table should calculate 2 aggegrate statistics about your the files in your zipfile

# 1. it should give the total number of files in the zipfile
# 2. it should give the total number of bytes of all files in the zipfile
# 3. As a bonus: count the number of times the letter a occurs in all text files in the zipfile. By all means use AI to find out how to do this

# Depending on your data the table could look like this:
# | Statistic | Value |
# -----------------------------
# | Total number of files | 12 | 
# | Total number of bytes | 762376 | 
# | Total occurrences of 'a' in text files | 2378 | 


##################################################################################
# Hints

# Hint 1: Write a function that extracts the statistics and put them in a dataframe. 
#  In order to do that you can copy extract_the_data_you_are_interested_in() and then modify it so it extracts the total number of files and bytes

# Hint 2: If you wrote that function, then
# Changes these lines:
# extracted_data = extract_the_data_you_are_interested_in(file_prompt_result.value)
# consent_prompt = generate_consent_prompt(extracted_data)

# to:
# extracted_data = extract_the_data_you_are_interested_in(file_prompt_result.value)
# extracted_data_statistics = extract_statistics_you_are_interested_in(file_prompt_result.value)
# consent_prompt = generate_consent_prompt(extracted_data, extracted_data_statistics)

##################################################################################
# Answer:

# Uncomment all these lines to see the answer in action

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

def get_file_contents(zip_file: str, filenames: list[str]):
    out = {}
    try:
        with zipfile.ZipFile(zip_file) as zf:
            for name in filenames:
                with zf.open(name) as file:
                    filename = os.path.basename(name)
                    content = file.read()
                    out[filename] = content
    except zipfile.BadZipFile:
        return False
    return out

def process(session_id: str):
    platform = "Meta Ad Information Data Donation"

    # Start of the data donation flow
    while True:
        # Ask the participant to submit a file
        file_prompt = generate_file_prompt("file_upload_prompt.md", "application/zip, text/plain")
        file_prompt_result = yield render_page(platform, file_prompt)

        # If the participant submitted a file: continue
        if file_prompt_result.__type__ == 'PayloadString':

            # Validate the file the participant submitted
            # In general this is wise to do
            zip_file = file_prompt_result.value
            is_data_valid = validate_the_participants_input(zip_file)

            # Happy flow:
            # The file the participant submitted is valid
            if is_data_valid == True:

                # Extract the data you as a researcher are interested in, and put it in a pandas DataFrame
                # Show this data to the participant in a table on screen
                # The participant can now decide to donate
                files_metadata = extract_files_metadata(zip_file)
                ad_preferences = tabulate_ad_preferences(zip_file)
                advertisers = extract_advertisers(zip_file)
                # consent_prompt = generate_consent_prompt(extracted_data_statistics, extracted_advertisers)
                consent_prompt = generate_consent_prompt(files_metadata, ad_preferences, advertisers)
                consent_prompt_result = yield render_page(platform, consent_prompt)

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

                break

            # Sad flow:
            # The data was not valid, ask the participant to retry
            if is_data_valid == False:
                retry_prompt = generate_retry_prompt(platform)
                retry_prompt_result = yield render_page(platform, retry_prompt)

                # The participant wants to retry: start from the beginning
                if retry_prompt_result.__type__ == 'PayloadTrue':
                    continue
                # The participant does not want to retry or pressed skip
                else:
                    break

        # The participant did not submit a file and pressed skip
        else:
            break

    yield exit_port(0, "Success")
    yield render_end_page()

