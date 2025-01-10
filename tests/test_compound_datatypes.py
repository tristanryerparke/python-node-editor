import json
import numpy as np
from PIL import Image
from devtools import debug as d

from pne_backend.field import (
    dynamic_datatype_load, 
    InputNodeField, 
    ModelNotFoundError
)
from pne_backend.datatypes.compound import ModelData, ListData
from pne_backend.datatypes.basic import IntData, FloatData, StringData
from pne_backend.datatypes.image import ImageData

DATATYPE_REGISTRY = dynamic_datatype_load('pne_backend.datatypes')

def test_list_of_data_from_frontend():

    # ensure that listdata has a datatype dictionary to infer types from
    ListData.datatype_registry = DATATYPE_REGISTRY

    data_list_dict = {
        'class_name': 'ListData',
        'payload': [
            IntData(payload=1).model_dump(), 
            FloatData(payload=2).model_dump()
        ]
    }

    list_of_data = ListData.model_validate(data_list_dict)

    d(list_of_data)

# test_list_of_data_from_frontend()

def test_list_of_data_from_backend():
    
    ListData.datatype_registry = DATATYPE_REGISTRY

    list_of_data = ListData(payload=[
        IntData(payload=1),
        FloatData(payload=2)
    ])

    list_of_data_json = list_of_data.model_dump_json()
    d(list_of_data_json)

    list_of_data_from_json = ListData.model_validate_json(list_of_data_json)

    d(list_of_data)

# test_list_of_data_from_backend()

def test_nested_list_of_data():

    ListData.datatype_registry = DATATYPE_REGISTRY

    item_1 = IntData(payload=1)
    item_2 = FloatData(payload=2)

    list_1 = ListData(payload=[item_1, item_2])
    
    l = ListData(payload=[
        list_1,
    ])

    l_json = l.model_dump_json()
    d(l_json)
    l_from_json = ListData.model_validate_json(l_json)
    d(l_from_json)

# test_nested_list_of_data()

def test_model_data():
    img = np.array(Image.open('tests/materials/monkey_1mb.png').resize((250, 250)))
    image = ImageData(payload=img)
    width_mm = FloatData(payload=100)
    height_mm = FloatData(payload=100)
    units = StringData(payload='mm')
    
    class Document(ModelData):
        image: ImageData
        width_mm: FloatData
        height_mm: FloatData
        units: StringData
    
    document = Document(image=image, width_mm=width_mm, height_mm=height_mm, units=units)
    d(document)
    d_as_json = document.model_dump_json()
    d(json.dumps(json.loads(d_as_json), indent=4))

    document_from_json = Document.model_validate_json(d_as_json)
    d(document_from_json)

    assert np.array_equal(document.image.payload, document_from_json.image.payload)
    assert document.width_mm.payload == document_from_json.width_mm.payload
    assert document.height_mm.payload == document_from_json.height_mm.payload
    assert document.units.payload == document_from_json.units.payload

# test_model_data()

def test_document_with_list():

    ListData.datatype_registry = DATATYPE_REGISTRY

    img = np.array(Image.open('tests/materials/monkey_1mb.png').resize((250, 250)))
    image = ImageData(payload=img)
    width_mm = FloatData(payload=100)
    height_mm = FloatData(payload=100)
    units = StringData(payload='mm')

    list_of_bs = ListData(payload=[
        IntData(payload=1),
        FloatData(payload=2),
        StringData(payload='hello')
    ])

    class TestDocumentWithList(ModelData):
        image: ImageData
        width_mm: FloatData
        height_mm: FloatData
        units: StringData
        list_of_bs: ListData

    document = TestDocumentWithList(
        image=image,
        width_mm=width_mm,
        height_mm=height_mm,
        units=units,
        list_of_bs=list_of_bs
    )
    d(document)
    d_as_json = document.model_dump_json()
    d(json.dumps(json.loads(d_as_json), indent=4))

    document_from_json = TestDocumentWithList.model_validate_json(d_as_json)
    d(document_from_json)

    assert np.array_equal(document.image.payload, document_from_json.image.payload)
    assert document.width_mm.payload == document_from_json.width_mm.payload
    assert document.height_mm.payload == document_from_json.height_mm.payload
    assert document.units.payload == document_from_json.units.payload
    assert document.list_of_bs.payload == document_from_json.list_of_bs.payload

# test_document_with_list()


def test_document_with_list_of_lists():
    ListData.datatype_registry = DATATYPE_REGISTRY

    img = np.array(Image.open('tests/materials/monkey_1mb.png').resize((250, 250)))
    image = ImageData(payload=img)
    width_mm = FloatData(payload=100)
    height_mm = FloatData(payload=100)
    units = StringData(payload='mm')

    inner_list_1 = ListData(payload=[
        IntData(payload=1),
        FloatData(payload=2.5)
    ])

    inner_list_2 = ListData(payload=[
        StringData(payload='hello'),
        IntData(payload=42)
    ])

    list_of_lists = ListData(payload=[
        inner_list_1,
        inner_list_2
    ])

    class TestDocumentWithListOfLists(ModelData):
        image: ImageData
        width_mm: FloatData
        height_mm: FloatData
        units: StringData
        list_of_lists: ListData

    document = TestDocumentWithListOfLists(
        image=image,
        width_mm=width_mm,
        height_mm=height_mm,
        units=units,
        list_of_lists=list_of_lists
    )

    d(document)
    d_as_json = document.model_dump_json()
    d(json.dumps(json.loads(d_as_json), indent=4))

    document_from_json = TestDocumentWithListOfLists.model_validate_json(d_as_json)
    d(document_from_json)

    assert np.array_equal(document.image.payload, document_from_json.image.payload)
    assert document.width_mm.payload == document_from_json.width_mm.payload
    assert document.height_mm.payload == document_from_json.height_mm.payload
    assert document.units.payload == document_from_json.units.payload
    assert document.list_of_lists.payload == document_from_json.list_of_lists.payload

# test_document_with_list_of_lists()



def test_nested_model_data():
    
    ListData.datatype_registry = DATATYPE_REGISTRY
    
    img = np.array(Image.open('tests/materials/monkey_1mb.png').resize((250, 250)))
    image = ImageData(payload=img)
    width_mm = FloatData(payload=100)
    height_mm = FloatData(payload=100)
    units = StringData(payload='mm')

    class TestItem(ModelData):
        a: IntData
        b: FloatData
        c: StringData

    item_1 = TestItem(a=IntData(payload=1), b=FloatData(payload=2), c=StringData(payload='hello'))
    
    
    class DocumentWithExtraTestItem(ModelData):
        image: ImageData
        width_mm: FloatData
        height_mm: FloatData
        units: StringData
        extra_test_item: TestItem
    
    document = DocumentWithExtraTestItem(
        image=image, 
        width_mm=width_mm, 
        height_mm=height_mm, 
        units=units,
        extra_test_item=item_1
    )
    d(document)
    d_as_json = document.model_dump_json()
    d(json.dumps(json.loads(d_as_json), indent=4))

    with open('tests/materials/document_with_extra_test_item.json', 'w') as f:
        f.write(d_as_json)

    document_from_json = DocumentWithExtraTestItem.model_validate_json(d_as_json)
    d(document_from_json)

# test_nested_model_data()


def test_list_of_model_data():

    class TestItem1(ModelData):
        a: IntData
        b: FloatData
        c: StringData

    class TestItem2(ModelData):
        a: IntData
        b: FloatData
        c: StringData
        d: StringData

    # DATATYPE_REGISTRY['ModelData'] = ModelData
    DATATYPE_REGISTRY['TestItem1'] = TestItem1
    DATATYPE_REGISTRY['TestItem2'] = TestItem2
    ListData.datatype_registry = DATATYPE_REGISTRY

    item_1 = TestItem1(a=IntData(payload=1), b=FloatData(payload=2), c=StringData(payload='hello'))
    item_2 = TestItem2(a=IntData(payload=3), b=FloatData(payload=4), c=StringData(payload='world'), d=StringData(payload='extra'))

    list_of_items = ListData(payload=[item_1, item_2])

    # list_of_items_json = list_of_items.model_dump_json()
    # d(list_of_items_json)

test_list_of_model_data()

