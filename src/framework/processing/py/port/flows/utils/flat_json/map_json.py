from . import flatten_json
from . import map_json_transform
import re

def create_regex_from_path(path):
    """Create a regex pattern from a given path string.
    
    The path can contain dots and square brackets, which will be escaped appropriately.
    Dots will be escaped to match literal dots, and square brackets will be escaped
    to match list indices. The resulting regex can be used to match keys in a flattened JSON object.
    
    Returns a dictionary containing the regex pattern and the indices extracted from the path.
    
    Example:
    >>> create_regex_from_path("a.b.[a].[b].c.[c]")
    {
        "regex": r"a\.b\.\[(d+)\].\[(d+)\]\.c\.\[(d+)\]",
        "indices": ["a", "b", "c"],
        "wildcards": []
    }
    """
    
    # Escape dots and square brackets in the path
    escaped_path = re.sub(r'\.', r'\\.', path)
    
    # Extract indices from the path
    indices = re.findall(r'\[([^\]]+)\]', path)
    # Replace the indices with a regex pattern that matches any string
    for index in indices:
        # If an actual number is given, leave it as is so it can be matched literally
        is_number = re.match(r'^\d+$', index)
        if is_number:
            escaped_path = escaped_path.replace(f"[{index}]", f"\\[({index})\\]")
            continue
        escaped_path = escaped_path.replace(f"[{index}]", r"\[(\d+)\]")
    
    # Replace wildcards with a regex pattern that matches and group any string
    escaped_path = re.sub(r'\*', r'(.*)', escaped_path)
    
    # Create the regex pattern
    regex_pattern = f"^{escaped_path}$"
    
    return {
        "regex": regex_pattern,
        "indices": indices
    }

def match_path(path, regex, indices, **kwargs):
    """Match a given regex pattern against a list of indices.
    
    This function checks if the provided indices match the regex pattern.
    
    Args:
        path (str): The path string containing dots and square brackets.
        regex (str): The regex pattern to match against the indices.
        indices (list): The list of placeholder indices.
    
    Returns:
        dict: A dictionary containing the regex pattern and a boolean indicating if the indices match.
        
    Example:
    >>> match_path("a.b.[0].[1].c.[0]", r"a\.b\.\[d+\].\[d+\]\.c\.\[d+\]", ["a", "b", "c"])
    {
        "match": True,
        "indices": {
            "a": "0",
            "b": "1",
            "c": "0"
        },
        "wildcards": []
    }
    """
    # Check if the indices match the regex pattern
    match = re.match(regex, path) is not None
    
    # Get the grouped indices from the regex match
    groups = re.match(regex, path)
    matched_indices = []
    wildcards = []
    # Extract matched indices and wildcards from the regex groups
    if groups:
        matched_indices = [g for g in groups.groups() if g.isdigit()]
        wildcards = [g for g in groups.groups() if not g.isdigit()]
    
    return {
        "match": match,
        "indices": {
            indices[i]: matched_indices[i] if matched_indices and i < len(matched_indices) else None
            for i in range(len(indices))
        },
        "wildcards": wildcards
    }

def resolve_path(path: str, indices, wildcards, **kwargs):
    # Inject the indices into the path
    for key, value in indices.items():
        path = path.replace(f"[{key}]", f"[{value}]")
    # Inject the wildcards into the path
    for wildcard in wildcards:
        path = path.replace(f"*", f"{wildcard}", 1)
    return path

# path_regex = create_regex_from_path("a.b.[a].[b].c.[c]")
# match = match_path("a.b.[0].[1].c.[0]", path_regex["regex"], path_regex["indices"])
# # print(path_regex['regex'])
# print(resolve_path("[a].[b].[c]", match["indices"]))

def map_json(data, mapping, verbose=False):
    """Generate a new JSON object based on a mapping from an existing JSON object,
    where the keys in the new object are derived from the mapping and the values
    are taken from the original object.
    
    The mapping is a list of dictionaries, each containing a 'from' key
    and a 'to' key. The 'from' key specifies the path in the original JSON object,
    and the 'to' key specifies the path in the new JSON object.
    
    The paths are specified using dot notation, and list indices can be specified
    using square brackets. The function will traverse the original JSON object
    according to the 'from' paths, and create a new JSON object with the specified
    'to' paths.

    Args:
        data (dict): The original JSON object to map.
        mapping (list): A list of dictionaries specifying the mapping from 'from' to 'to'.
    """
    flattened_data = flatten_json.flatten(data)
    if verbose: print("Flattened data:", flattened_data)
    new_data_flattened = {}
    for map_item in mapping:
        from_path = map_item.get('from')
        to_path = map_item.get('to')
        
        # If the from_path is missing, write None to the to_path
        if from_path is None:
            if verbose: print(f"Path '{from_path}' not defined, setting '{to_path}' to None")
            value = None
            if 'transform' in map_item:
                value = map_json_transform.apply_method(map_item['transform'], value)
            new_data_flattened[to_path] = value
            continue
        
        # Create regex from the 'from' path
        path_regex = create_regex_from_path(from_path)
        if verbose: print(f"Mapping from '{from_path}' to '{to_path}' with regex: {path_regex['regex']} and indices: {path_regex['indices']}")
        
        # Match the flattened keys against the regex
        for key in flattened_data.keys():
            match_result = match_path(key, **path_regex)
            if verbose: print(f"Matching key '{key}' against regex {path_regex}: {match_result}")
            if match_result['match']:
                # Resolve the 'to' path with matched indices
                resolved_to_path = resolve_path(to_path, **match_result)
                value = flattened_data[key]
                # If there is a transformation specified, apply it
                if 'transform' in map_item:
                    value = map_json_transform.apply_method(
                        map_item['transform'], value
                    )
                new_data_flattened[resolved_to_path] = value
    # Convert the flattened new data back to a nested structure
    new_data = flatten_json.unflatten(new_data_flattened)
    return new_data

sample_data = {
    "observer": {
        "demographic_characteristics": {
            "device": {
                "platform_usage": {
                    "platforms_used_weekly_in_study": [
                        "Facebook",
                        "Instagram",
                        "NULL"
                    ]
                }
            }
        },
        "wildcard_dict": {
            "field_1": "value_1",
            "field_2": {
                "sub_field_1": "value_2",
                "sub_field_2": "value_3"
            },
            "field_3": ["item_1", "item_2"]
        },
        "example_field": "example_value"
    }
}

sample_mapping = [
    # {
    #     "from": "observer.demographic_characteristics.device.platform_usage.platforms_used_weekly_in_study.[a]",
    #     "to": "platforms_used_weekly_in_study.[a].transformed",
    #     "transform": "NULL_STRING_TO_NONE"
    # },
    # {
    #     "from": "observer.demographic_characteristics.device.platform_usage.platforms_used_weekly_in_study.[a]",
    #     "to": "platforms_used_weekly_in_study.[a].original"
    # },
    # {
    #     "from": "observer.example_field",
    #     "to": "example"
    # },
    {
        "from": "observer.demographic_characteristics.*",
        "to": "demographic_characteristics.*",
    }
]

if __name__ == "__main__":
    mapped_data = map_json(sample_data, sample_mapping, verbose=True)
    print(mapped_data)
    # Expected output:
    # {
    #     "platforms_used_weekly_in_study": {
    #         "0": "Facebook",
    #         "1": "Instagram"
    #     }
    # }