import json

with open('src/basic_data.json', 'r') as f:
    int_data = json.load(f)

with open('src/list_data.json', 'r') as f:
    list_data = json.load(f)

with open('src/model_data.json', 'r') as f:
    model_data = json.load(f)

with open('src/nested_model_data.json', 'r') as f:
    nested_model_data = json.load(f)

def is_basic_data(data):
    return data["class_name"] in ["IntData", "FloatData", "StringData", "BoolData"]


def render(data, running_indent=0, pad_object=' ', current_key=None):
    lines = []
    indent_str = pad_object * running_indent

    # Only add a "." if there's actually a current_key name
    key_display = f"{current_key}: " if current_key else ""

    if is_basic_data(data):
        lines.append(f'{indent_str}{key_display}{data["class_name"]}: {data["payload"]}\n')

    elif data["class_name"] == "ListData":
        if current_key:
            lines.append(f'{indent_str}{key_display}: {data["class_name"]}[\n')
        else:
            lines.append(f'{indent_str}{data["class_name"]}[\n')
        for item in data["payload"]:
            lines.append(render(item, running_indent + 1, pad_object))
        lines.append(f'{indent_str}]\n')

    elif data["class_name"] == "ModelData":
        if current_key:
            lines.append(f'{indent_str}{key_display}: {data["class_name"]}(\n')
        else:
            lines.append(f'{indent_str}{data["class_name"]}(\n')
        # Recursively render each key in the payload
        for key, value in data["payload"].items():
            lines.append(render(value, running_indent + 1, pad_object, current_key=key))
        lines.append(f'{indent_str})\n')

    else:
        lines.append(f'{indent_str}unknown data type: {data["class_name"]}\n')

    return ''.join(lines)

print(render(int_data))
print(render(list_data))
print(render(model_data))
print(render(nested_model_data))

from devtools import debug

debug(model_data)
