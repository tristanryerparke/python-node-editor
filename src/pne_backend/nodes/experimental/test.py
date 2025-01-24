
class Data:
    def __init__(self, value):
        self.payload = value

    def __repr__(self):
        return f"Data({self.payload})"


list1 = [
    Data(1),
    Data(2),
    Data(3),
    Data(4),
    [
        Data(5),
        Data(6),
    ]
]


for item in list1:
    if isinstance(item, list):
        for subitem in item:
            subitem.payload = -1
    else:
        item.payload = -1

print(list1)



