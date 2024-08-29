from fastapi import APIRouter, UploadFile, File, Form

large_files_router = APIRouter()

@large_files_router.post("/large_files")
async def handle_large_file(
    file: UploadFile = File(...),
    original_filename: str = Form(...),
    file_extension: str = Form(...)
):
    file_content = await file.read()
    print(f"Received file: {file.filename}")
    print(f"Original filename: {original_filename}")
    print(f"File extension: {file_extension}")
    print(f"File size: {len(file_content)} bytes")
    
    # Generate a dummy file ID
    file_id = f"large_file_{hash(file.filename)}"
    
    print(f"Assigned file ID: {file_id}")
    
    # Here you would typically save the file or process it
    # For this dummy route, we'll just return the file ID
    
    return {"fileId": file_id}