import json

from ..api.commands import CommandSystemDonateFilesProps

from .common import (
    render_page, 
    validate_the_participants_input, 
    extract_files_metadata, 
    generate_consent_prompt, 
    get_file_contents, 
    donate_files, 
    generate_retry_prompt,
    generate_file_prompt,
    zip_to_data_tables
)
platform = "facebook"
title = "Facebook Ad Information Donation"
tables = [
    {
        "filename": "ads_information/ad_preferences.json",
        "name": "Ad preferences",
        "columns": [
            {
                "from": "label_values.[i].ent_field_name",
                "field": "ent_field_name",
                "name": "Field Name",
            },
            {
                "from": "label_values.[i].label",
                "field": "label",
                "name": "Label",
            },
            {
                "from": "label_values.[i].value",
                "field": "value",
                "name": "Value",
            }
        ]
    },
    {
        "filename": "ads_information/ad_preferences.json",
        "name": "Ad interests",
        "columns": [
            {
                "from": "label_values.[-1].dict.[i].dict.[0].value",
                "field": "value",
                "name": "Value",
            },
            {
                "from": "label_values.[-1].dict.[i].dict.[0].label",
                "field": "label",
                "name": "Label",
            }
        ]
    },
    {
        "filename": "ads_information/advertisers_using_your_activity_or_information.json",
        "name": "Advertisers using your activity or information",
        "columns": [
            {
                "from": "custom_audiences_all_types_v2.[i].advertiser_name",
                "field": "advertiser_name",
                "name": "Advertiser Name",
            },
            {
                "from": "custom_audiences_all_types_v2.[i].has_data_file_custom_audience",
                "field": "has_data_file_custom_audience",
                "name": "Has Data File Custom Audience",
            },
            {
                "from": "custom_audiences_all_types_v2.[i].has_remarketing_custom_audience",
                "field": "has_remarketing_custom_audience",
                "name": "Has Remarketing Custom Audience",
            },
            {
                "from": "custom_audiences_all_types_v2.[i].has_in_person_store_visit",
                "field": "has_in_person_store_visit",
                "name": "Has In-Person Store Visit",
            }
        ]
    },
]

filename_patterns = [
    table["filename"] for table in tables
]


def facebook_flow(session_id: str, config: dict):
    # Ask the participant to submit a file
    file_prompt = generate_file_prompt("file_upload_prompt.md", "application/zip, text/plain")
    file_prompt_result = yield render_page(title, file_prompt)
    
    if file_prompt_result.__type__ == "PayloadFalse":
        return
    
    # If the participant submitted a file: continue
    
    # Validate the file the participant submitted
    # In general this is wise to do
    zip_file = file_prompt_result.value
    is_data_valid = validate_the_participants_input(zip_file, filename_patterns)

    # Happy flow:
    # The file the participant submitted is valid
    if is_data_valid == True:

        # Extract the data you as a researcher are interested in, and put it in a pandas DataFrame
        # Show this data to the participant in a table on screen
        # The participant can now decide to donate
        files_metadata = extract_files_metadata(zip_file, filename_patterns)
        data_tables = zip_to_data_tables(zip_file, tables)
        # consent_prompt = generate_consent_prompt(extracted_data_statistics, extracted_advertisers)
        consent_prompt = generate_consent_prompt(files_metadata, *data_tables)
        consent_prompt_result = yield render_page(title, consent_prompt)

        # If the participant wants to donate the data gets donated
        if consent_prompt_result.__type__ == "PayloadJSON":
            result_value = json.loads(consent_prompt_result.value)
            submitted_files = result_value[0]['zip_contents_0']
            filenames = [file['File name'] for file in submitted_files]
            # Extract the zip and save the files into an "file-output" folder
            blobs = get_file_contents(zip_file, filenames)
            yield donate_files(
                f"{session_id}", 
                blobs, 
                props=CommandSystemDonateFilesProps(
                    platform=platform
                )
            )
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