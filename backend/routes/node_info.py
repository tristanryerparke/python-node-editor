
from fastapi import APIRouter


from shared_globals import EXECUTION_WRAPPER


from devtools import debug as d



node_info_router = APIRouter()



@node_info_router.get("/node_info")
def get_node_info(node_id: str):

    # d(EXECUTION_WRAPPER.node_instances)
    
    try:
        node = EXECUTION_WRAPPER.node_instances[node_id]
    except KeyError:
        return {'error': 'Node not found'}

    input_data = node.inputs
    output_data = node.outputs

    



    return {'input_data': input_data, 'output_data': output_data}
