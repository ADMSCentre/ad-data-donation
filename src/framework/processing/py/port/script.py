import port.api.props as props # Keep for direct prop usage if any in future in this file

from .flows.common import render_end_page, exit_port, unknown_flow # unknown_flow is now in common
from .flows.facebook import facebook_flow
from .flows.instagram import instagram_flow
    
platform_flows = {
    "facebook": facebook_flow,
    "instagram": instagram_flow,
}

def process(session_id: str, config = {}):
    platform = config.get("platform", "facebook").lower()
    
    # unknown_flow is now imported from common, so it can be used as a default
    flow = platform_flows.get(platform, unknown_flow)
    
    # Use "yield from" here to get all steps of the flow (otherwise 
    # it yields the generator instead of the steps)
    yield from flow(session_id, config)
    
    yield exit_port(0, "Success")
    yield render_end_page()