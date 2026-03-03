from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

VIDEOS_DIR = "../videos"

@router.get("/api/videos/{filename}")
async def get_video(filename: str):
    """获取本地视频文件"""
    # 安全检查：防止路径遍历攻击
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="无效的文件名")
    
    filepath = os.path.join(VIDEOS_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="视频文件不存在")
    
    return FileResponse(
        filepath,
        media_type="video/mp4",
        filename=filename
    )
