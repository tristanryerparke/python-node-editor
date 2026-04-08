from python_node_editor.display import construct, construct_deconstruct, deconstruct
from python_node_editor.schema_base import UserModel


class NoDecorator(UserModel):
    value: float


@construct
class ConstructOnly(UserModel):
    value: float


@deconstruct
class DeconstructOnly(UserModel):
    value: float


@construct_deconstruct
class ConstructDeconstruct(UserModel):
    value: float


def passthrough_no_decorator(arg: NoDecorator) -> NoDecorator:
    return arg


def passthrough_construct_only(arg: ConstructOnly) -> ConstructOnly:
    return arg


def passthrough_deconstruct_only(arg: DeconstructOnly) -> DeconstructOnly:
    return arg


def passthrough_construct_deconstruct(arg: ConstructDeconstruct) -> ConstructDeconstruct:
    return arg
