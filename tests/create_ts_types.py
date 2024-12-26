import json
from pne_backend.field import dynamic_datatype_load

def get_ts_type(schema, schema_defs):
    schema_type = schema.get("type")
    if "$ref" in schema:
        ref = schema["$ref"]
        ref_name = ref.split("/")[-1]
        return ref_name
    elif schema_type == "string":
        return "string"
    elif schema_type == "number":
        return "number"
    elif schema_type == "integer":
        return "number"
    elif schema_type == "boolean":
        return "boolean"
    elif schema_type == "array":
        items = schema.get("items", {})
        item_type = get_ts_type(items, schema_defs)
        return f"{item_type}[]"
    elif schema_type == "object":
        properties = schema.get("properties", {})
        if properties:
            # Anonymous object type
            prop_strings = []
            for prop_name, prop_schema in properties.items():
                # Skip class_name field
                if prop_name != "class_name":
                    prop_type = get_ts_type(prop_schema, schema_defs)
                    prop_strings.append(f"  {prop_name}: {prop_type};")
            return "\n".join(prop_strings)
        else:
            return "Record<string, any>"
    elif "anyOf" in schema:
        types = [get_ts_type(t, schema_defs) for t in schema["anyOf"]]
        return " | ".join(types)
    elif schema_type == "ndarray":
        return "number[]"
    elif schema_type == "image":
        return "string"
    return "any"

def format_interface(name, body):
    return f"export interface {name} {{\n{body}\n}}"

def process_definitions(defs):
    interfaces = {}
    for def_name, def_schema in defs.items():
        interface_body = get_ts_type(def_schema, defs)
        interfaces[def_name] = f"export interface {def_name} {{\n{interface_body}\n}}"
    return interfaces

def has_refs(schema):
    """Check if a schema contains any $ref or $defs"""
    if isinstance(schema, dict):
        if "$ref" in schema or "$defs" in schema:
            return True
        return any(has_refs(v) for v in schema.values())
    elif isinstance(schema, list):
        return any(has_refs(item) for item in schema)
    return False

# load basic and compound datatypes defined in the datatypes directory
DATATYPE_REGISTRY = dynamic_datatype_load('pne_backend.datatypes')
DATATYPE_REGISTRY.update(dynamic_datatype_load('pne_backend.nodes.cme'))

# Generate TypeScript interfaces
all_interfaces = {}
simple_types = {}
complex_types = {}

# First pass: separate simple and complex types
for name, datatype in DATATYPE_REGISTRY.items():
    schema = datatype.model_json_schema()
    if has_refs(schema):
        complex_types[name] = schema
    else:
        simple_types[name] = schema

# Process simple types first
for name, schema in simple_types.items():
    interface_body = get_ts_type(schema, {})
    all_interfaces[name] = format_interface(name, interface_body)

# Then process complex types
for name, schema in complex_types.items():
    defs = schema.get("$defs", {})
    for def_name, def_schema in defs.items():
        interface_body = get_ts_type(def_schema, defs)
        all_interfaces[def_name] = format_interface(def_name, interface_body)
    
    interface_body = get_ts_type(schema, defs)
    all_interfaces[name] = format_interface(name, interface_body)


out_string = "\n\n".join(all_interfaces.values())

path = 'src/pne_frontend/src/types/DynamicTypes.tsx'

with open(path, 'w') as f:
    f.write(out_string)
