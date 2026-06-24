class UserFacingNodeError(Exception):
    """An execution error whose message is safe to show directly to users.

    Raise this for expected input/validation failures where a Python traceback would
    mostly expose PNE internals instead of helping the user fix their graph.
    """

