from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
import os
import uuid
import aiofiles

router = APIRouter()

UPLOAD_DIR = "../uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_FORMATS = {"image/jpeg", "image/png", "image/webp"}

class UploadResponse(BaseModel):
    success: bool
    url: str = None
    error: str = None

def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/api/upload", response_model=UploadResponse)
async def upload_image(request: Request, file: UploadFile = File(...)):
    """上传图片文件"""
    ensure_upload_dir()
    
    # 验证文件格式
    if file.content_type not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail="仅支持 JPEG、PNG、WebP 格式图片"
        )
    
    # 读取文件内容并验证大小
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="图片大小不能超过 10MB"
        )
    
    # 生成唯一文件名
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # 保存文件
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(content)
    
    # 返回可访问的 URL
    base_url = str(request.base_url).rstrip('/')
    url = f"{base_url}/uploads/{filename}"
    
    return UploadResponse(success=True, url=url)
