from collections.abc import MutableMapping
from enum import Enum
import json

class AllowedType(Enum):
    LIST = "list"
    DICT = "dict"

def flatten(dictionary, parent_key=None, parent_type: AllowedType=None, separator='.', verbose=False):
    """
    Turn a nested dictionary into a flattened dictionary
    :param dictionary: The dictionary to flatten
    :param parent_key: The string to prepend to dictionary's keys
    :param separator: The string used to separate flattened keys
    :return: A flattened dictionary
    """
    items = []
    for key, value in dictionary.items():
        if verbose: print('checking:',key)
        # If parent type is list, wrap key in square brackets
        if parent_type == AllowedType.LIST:
            key = f'[{key}]'
            if verbose: print('parent type is list, wrapping key in square brackets:',key)
        new_key = str(parent_key) + separator + key if parent_key else key
  
        if isinstance(value, MutableMapping):
            if verbose: print(new_key,': dict found')
            if not value.items():
                if verbose: print('Adding key-value pair:',new_key,None)
                items.append((new_key,None))
            else:
                items.extend(flatten(value, new_key, AllowedType.DICT, separator).items())
        elif isinstance(value, list):
            if verbose: print(new_key,': list found')
            if len(value):
                for k, v in enumerate(value):
                    items.extend(flatten({str(k): v}, new_key, AllowedType.LIST, separator).items())
            # If the list is empty, add it as a key with None value
            else:
                if verbose: print('Adding key-value pair:', new_key ,None)
                items.append((new_key,None))
        else:
            if verbose: print('Adding key-value pair:',new_key,value)
            items.append((new_key, value))
    return dict(items)

def is_list_index(key):
    """
    Check if the key is a list index
    :param key: The key to check
    :return: True if the key is a list index, False otherwise
    """
    if key is None:
        return False
    if isinstance(key, int):
        return True
    return key.startswith('[') and key.endswith(']') and key[1:-1].isdigit()

def parse_list_index(key):
    """
    Parse a list index from a string key
    :param key: The string key to parse
    :return: The parsed index or None if not a list index
    """
    if key is None:
        return None
    if key.startswith('[') and key.endswith(']'):
        try:
            return int(key[1:-1])
        except ValueError:
            return None
    return None

def unflatten(dictionary, separator='.', verbose=False):
    """
    Turn a flattened dictionary into a nested dictionary
    :param dictionary: The dictionary to unflatten
    :param separator: The string used to separate flattened keys
    :return: A nested dictionary
    """
    result_dict = {}
    for key, value in dictionary.items():
        if verbose: print('\nprocessing:', key, "=", value)
        parts = key.split(separator)
        if verbose: print('Parts:', parts)
        current_level = result_dict
        if verbose: print('Current level:', current_level)
        # for part, next_part in zip(parts[:-1], parts[1:]):
        #     if verbose: print('Current part:', part, 'Next part:', next_part)
        #     # Check if the next level exists, if not create it
        #     # current_level_exists = current_level.get(part) if isinstance(current_level, dict) else current_level[parse_list_index(part)] if isinstance(current_level, list) else None
            
        #     if isinstance(current_level, dict):
        #         current_level_exists = current_level.get(part)
        #     else:
        #         current_level_exists = None
            
        #     current_key = part
        #     if is_list_index(part):
        #         if verbose: print('Part is a list index:', current_key)
        #         current_key = parse_list_index(part)
        #         while len(current_level) <= current_key:
        #             current_level.append(None)
        #     if current_level_exists is None:
        #         if verbose: print('Creating new level for part:', part)
        #         if next_part is None:
        #             current_level[current_key] = None
        #         elif is_list_index(next_part):
        #             current_level[current_key] = []
        #         else:
        #             current_level[current_key] = {}
        #     # Move to the next level
        #     if verbose: print('Next key:', current_key)
        #     current_level = current_level[current_key]
        # # Set the value at the final level
        # last_key = parts[-1]
        # if isinstance(current_level, list):
        #     last_key = parse_list_index(last_key)
        #     while len(current_level) <= last_key:
        #         current_level.append(None)
        # if verbose: print('Setting', last_key, '=', value, 'in', current_level)
        # current_level[last_key] = value
        # if verbose: print('Final dictionary:', result_dict)
        for part, next_part in zip(parts, parts[1:] + [None]):
            if verbose: print('Current part:', part, 'Next part:', next_part)
            is_last_level = next_part is None
            key = part
            if is_list_index(part):
                key = parse_list_index(part)
            
            def ensure_list_index():
                nonlocal current_level
                if not isinstance(current_level, list): return
                if not is_list_index(key): raise ValueError(f"Expected list index, got {key}")
                while len(current_level) <= key:
                    current_level.append(None)

            def next_level_exists():
                nonlocal current_level
                if isinstance(current_level, dict):
                    return key in current_level
                elif isinstance(current_level, list):
                    return len(current_level) > key

            def next_level():
                if verbose: print('Proceeding to next level with key:', key)
                nonlocal current_level
                if isinstance(current_level, dict):
                    current_level = current_level[key]
                elif isinstance(current_level, list):
                    ensure_list_index()
                    current_level = current_level[key]

            # If is the last level, set the value
            if is_last_level:
                if verbose: print('Setting', key, '=', value, 'in', current_level)
                ensure_list_index()
                current_level[key] = value
                continue
            
            # Try to create the next level if it doesn't exist
            if verbose: print('Checking if next level exists for key:', key)
            if not next_level_exists():
                if verbose: print('Next level does not exist, creating it for key:', key)
                ensure_list_index()
                if is_list_index(next_part):
                    current_level[key] = []
                else:
                    current_level[key] = {}
            
            # Otherwise, proceed to the next level
            next_level()
                
    return result_dict
# data = json.loads(open("raw.json", "r", encoding="utf-8").read())

def test():
    data = {'a': 1, 'c': {'a': 2, 'b': {'x': 5, 'y' : 10}}, 'd': [1, 2, 3], 'e': [{'a': 1, 'b': [1,2,3,4]}, {'a': 2, 'b': [2,3,4]}, {'a': 3, 'b': [4,5]}], 'f': [[1,2], [2,3,4], [3,4,5]]}
    flattened = {'a': 1, 'c.a': 2, 'c.b.x': 5, 'c.b.y': 10, 'd.[0]': 1, 'd.[1]': 2, 'd.[2]': 3, 'e.[0].a': 1, 'e.[1].a': 2, 'e.[2].a': 3, 'e.[0].b.[0]': 1, 'e.[0].b.[1]': 2, 'e.[0].b.[2]': 3, 'e.[0].b.[3]': 4, 'e.[1].b.[0]': 2, 'e.[1].b.[1]': 3, 'e.[1].b.[2]': 4, 'e.[2].b.[0]': 4, 'e.[2].b.[1]': 5, 'f.[0].[0]': 1, 'f.[0].[1]': 2, 'f.[1].[0]': 2, 'f.[1].[1]': 3, 'f.[1].[2]': 4, 'f.[2].[0]': 3, 'f.[2].[1]': 4, 'f.[2].[2]': 5}
    
    print('Flattening data:')
    flattened_data = flatten(data, verbose=False)
    print('\nflattened:', flattened_data)
    assert flattened_data == flattened, f'Expected {flattened}, but got {flattened_data}'

    print('\nUnflattening data:')
    unflattened = unflatten(flattened, verbose=False)
    print('\nunflattened:',unflattened)
    assert unflattened == data, f'Expected {data}, but got {unflattened}'
    
def main():
    data = json.loads(open("raw.json", "r", encoding="utf-8").read())
    flattened = flatten(data, verbose=False)
    with open("flattened.json", "w", encoding="utf-8") as f:
        json.dump(flattened, f, indent=4, ensure_ascii=False)
    unflattened = unflatten(flattened, verbose=False)
    with open("unflattened.json", "w", encoding="utf-8") as f:
        json.dump(unflattened, f, indent=4, ensure_ascii=False)
    
if __name__ == "__main__":
    # test()
    main()