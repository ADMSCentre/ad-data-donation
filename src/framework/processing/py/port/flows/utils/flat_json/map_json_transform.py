methods = {}

def register(name):
    """
    Decorator to register a method with a given name.
    """
    def decorator(func):
        methods[name] = func
        return func
    return decorator

def get_method(name):
    """
    Retrieve a registered method by its name.
    
    Args:
        name (str): The name of the method to retrieve.
    
    Returns:
        function: The registered method if found, otherwise None.
    """
    return methods.get(name, lambda value: name)
  
def list_methods():
    """
    List all registered methods.
    
    Returns:
        list: A list of names of all registered methods.
    """
    return list(methods.keys())

def apply_method(target, value):
    """
    Apply a registered method to a given value.
    
    Args:
        target (str or function): The name of the method to apply or the method itself.
        value: The value to which the method will be applied.
    
    Returns:
        The result of the method application, or None if the method is not found.
    """
    if callable(target):
        return target(value)
    
    method = get_method(target)
    if method:
        return method(value)
    return value

@register("NULL_STRING_TO_NONE")
def null_string_to_none(value):
    """
    Transform a string value to None if it is 'NULL'.
    
    Args:
        value (str): The value to transform.
    
    Returns:
        str or None: The transformed value.
    """
    if isinstance(value, str) and value == "NULL":
        return None
    return value