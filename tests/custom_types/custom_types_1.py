




from pne_backend.datatypes.basic import IntData, FloatData, StringData, NumpyData
from pne_backend.datatypes.compound import SendableDataModel


class CustomData3(SendableDataModel):
    a: IntData
    b: FloatData
    c: StringData



