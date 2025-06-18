from dataclasses import dataclass
import json
import os
import zipfile
import regex
import pandas as pd
import port.api.props as props
from port.api.commands import (CommandSystemDonate, CommandSystemDonateFilesProps, CommandSystemRestart, CommandUIRender, CommandSystemExit, CommandSystemDonateFiles)
from pyodide.http import open_url
from .utils.flat_json import flatten_json, map_json

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


@dataclass
class DataTable:
    name: props.Translatable
    data_frame: pd.DataFrame
    visualizations: list[dict] = None

def extract_files_metadata(zip_file: str, patterns: list[str]) -> DataTable:
    """
    This function extracts the data the researcher is interested in

    In this case we extract from the zipfile:
    * The file names
    * The compressed file size
    * The file size

    You could extract anything here
    """
    pd_table = pd.DataFrame()

    try:
        file = zipfile.ZipFile(zip_file)
        data = []
        for name in file.namelist():
            # Exclude files that are not of interest
            if not any(regex.match(pattern, name) for pattern in patterns):
                continue
            info = file.getinfo(name)
            data.append((name, info.compress_size, info.file_size))

        pd_table = pd.DataFrame(data, columns=["File name", "Compressed file size", "File size"])

    except Exception as e:
        print(f"Something went wrong: {e}")

    return DataTable(
        name=props.Translatable({
            "en": "The contents of your zipfile (only the files we are interested in)",
        }),
        data_frame=pd_table
    )


def validate_the_participants_input(zip_file: str, patterns: list[str]) -> bool:
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
            filenames = zf.namelist()
            print(f"[Validation] Found {len(filenames)} files in the zip file with names: {filenames}")
            # Ensure the pattern matches at least one file
            if not any(regex.match(pattern, name) for pattern in patterns for name in filenames):
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

def restart_system(target="__current__"):
    """
    Restarts the system
    """
    return CommandSystemRestart(target)

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

def generate_unimplemented_prompt(platform: str) -> props.PropsUIPromptConfirm:
    text = props.Translatable({
        "en": f"The {platform} flow is not implemented yet, but we are working on it!",
        "nl": f"De {platform} flow is nog niet geïmplementeerd, maar we werken eraan!"
    })
    ok = props.Translatable({
        "en": "Choose another platform",
        "nl": "Kies een ander platform"
    })
    cancel = props.Translatable({
        "en": "Exit",
        "nl": "Afsluiten"
    })
    return props.PropsUIPromptConfirm(text, ok, cancel)

def generate_unknown_platform_prompt(platform) -> props.PropsUIPromptConfirm:
    text = props.Translatable({
        "en": f"The '{platform}' platform is not supported.",
        "nl": f"Het '{platform}' platform is niet herkend."
    })
    ok = props.Translatable({
        "en": "Choose another platform",
        "nl": "Kies een ander platform"
    })
    cancel = props.Translatable({
        "en": "Exit",
        "nl": "Afsluiten"
    })
    return props.PropsUIPromptConfirm(text, ok, cancel)

def generate_file_prompt(description_public_path, extensions) -> props.PropsUIPromptFileInput:
    description = get_translatable_prompt(description_public_path)
    return props.PropsUIPromptFileInput(description, extensions)


def generate_consent_prompt(*args: DataTable) -> props.PropsUIPromptConsentForm:
    description = get_translatable_prompt("consent_form.md")

    donate_question = props.Translatable({
       "en": "Do you want to share this data for research?",
       "nl": "Wilt u deze gegevens delen voor onderzoek?"
    })

    donate_button = props.Translatable({
       "en": "Yes, share for research",
       "nl": "Ja, deel voor onderzoek"
    })

    tables = [] 
    for index, table in enumerate(args):
        print(f"[Consent Form] Adding table {index}", table)
        title = table.name
        data_frame = table.data_frame
        visualizations = table.visualizations if table.visualizations else []
        tables.append(props.PropsUIPromptConsentFormTable(f"zip_contents_{index}", title=title, data_frame=data_frame, visualizations=visualizations))

    return props.PropsUIPromptConsentForm(
       tables,
       [],
       description = description,
       donate_question = donate_question,
       donate_button = donate_button
    )


def donate(key, json_string):
    return CommandSystemDonate(key, json_string)

def donate_files(key, file_contents, props: CommandSystemDonateFilesProps):
    return CommandSystemDonateFiles(key, file_contents, props)

def exit_port(code, info):
    return CommandSystemExit(code, info)

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

def unknown_flow(session_id: str, config: dict):
    platform = config.get("platform", "unknown").lower()
    title = f"Unknown Platform: {platform}"
    retry_prompt = generate_unknown_platform_prompt(platform)
    retry_prompt_result = yield render_page(title, retry_prompt)
    
    if retry_prompt_result.__type__ == 'PayloadTrue':
        yield restart_system(target="?")
    else:
        return

def create_mapping_from_columns(columns):
    """Create a mapping from the columns definition."""
    mapping = []
    for column in columns:
        mapping.append({
            "from": column["from"],
            "to": f"rows.[i].{column['field']}"
        })
    return mapping

def get_table_rows(table):
    with open(table["filename"], "r", encoding="utf-8") as f:
        data = json.load(f)
    flattened_data = flatten_json.flatten(data, verbose=False)
    return map_json.map_json(flattened_data, 
                             create_mapping_from_columns(table["columns"]), 
                             verbose=False
                            ).get("rows", [])

def create_pandas_table(table) -> pd.DataFrame:
    """Create a pandas DataFrame from the table data."""
    rows = get_table_rows(table)
    return pd.DataFrame(rows)

def zip_to_data_tables(zip_file: str, tables: list) -> list[DataTable]:
    out: list[DataTable] = []
    try:
        file = zipfile.ZipFile(zip_file)
        target_files = [table["filename"] for table in tables]
        for name in file.namelist():
            if not name in target_files:
                continue
            target_table = next((table for table in tables if table["filename"] == name), None)
            with file.open(name) as json_file:
                ad_pref_dict = json.load(json_file)
                # Flatten the JSON data
                flattened_data = flatten_json.flatten(ad_pref_dict, verbose=False)
                # Map the flattened data to the desired structure
                mapped_data = map_json.map_json(flattened_data, 
                                                create_mapping_from_columns(target_table["columns"]), 
                                                verbose=False)
                # Convert to pandas DataFrame
                df = pd.DataFrame(mapped_data.get("rows", []))
                out.append(DataTable(
                    name=props.Translatable({"en": target_table["name"]}),
                    data_frame=df
                ))

    except Exception as e:
        print(f"Something went wrong: {e}")

    print(f"Created {len(out)} data tables:", out)

    return out