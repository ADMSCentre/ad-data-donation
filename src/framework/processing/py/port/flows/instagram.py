from .common import render_page, generate_unimplemented_prompt, restart_system

def instagram_flow(session_id: str, config: dict):
    title = "Instagram Ad Information Donation"
    
    retry_prompt = generate_unimplemented_prompt("instagram")
    retry_prompt_result = yield render_page(title, retry_prompt)
    
    if retry_prompt_result.__type__ == 'PayloadTrue':
        yield restart_system(target="?")
    else:
        return
