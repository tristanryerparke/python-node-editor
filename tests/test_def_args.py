from inspect import signature, Parameter

def example_function(a, b=10, c='default', d=None):
    pass

def get_default_args(func):
    sig = signature(func)
    return {
        k: v.default
        for k, v in sig.parameters.items()
        if v.default is not Parameter.empty
    }

# Example usage
default_args = get_default_args(example_function)
print(default_args)  # Output: {'b': 10, 'c': 'default', 'd': None}