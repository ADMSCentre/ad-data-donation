import os
import zipfile
import regex
import pandas as pd
import port.api.props as props
from port.api.commands import (CommandSystemDonate, CommandSystemRestart, CommandUIRender, CommandSystemExit, CommandSystemDonateFiles)
from pyodide.http import open_url

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

def extract_files_metadata(zip_file: str, patterns: list[str]) -> pd.DataFrame:
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
