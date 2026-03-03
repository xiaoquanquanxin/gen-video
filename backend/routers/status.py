from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import os

from services.video_generator import video_generator
from services.video_storage import video_storage
from services.history_store import history_store

router = APIRouter()

class StatusResponse(BaseModel):
    status: Literal['IN_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
    progress: int
    video_url: Optional[str] = None
    local_path: Optional[str] = None
    error: Optional[str] = None

def check_api_key():
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="ARK_API_KEY 环境变量未配置")

@router.get("/api/status/{task_id}", response_model=StatusResponse)
async def get_task_status(task_id: str):
    """查询任务状态"""
    check_api_key()
    
    try:
        result = await video_generator.get_status(task_id)
        
        response = StatusResponse(
            status=result["status"],
            progress=result.get("progress", 0),
            error=result.get("error")
        )
        
        # 任务完成时，下载视频并更新历史记录
        if result["status"] == "COMPLETED" and result.get("video_url"):
            video_url = result["video_url"]
            
            # 检查是否已下载
            if not video_storage.video_exists(task_id):
                try:
                    local_path = await video_storage.download_and_save(video_url, task_id)
                    
                    # 更新历史记录
                    records = await history_store.get_records()
                    for record in records:
                        if record.get("task_id") == task_id:
                            record["status"] = "completed"
                            record["local_path"] = f"/api/videos/{task_id}.mp4"
                            break
                    
                    # 重新保存历史记录
                    import aiofiles
                    import json
                    async with aiofiles.open(history_store.history_file, 'w', encoding='utf-8') as f:
                        await f.write(json.dumps({"records": records}, ensure_ascii=False, indent=2))
                    
                except Exception as e:
                    response.error = f"视频保存失败: {str(e)}"
                    response.video_url = video_url  # 提供原始 URL 作为备用
                    return response
            
            response.local_path = f"/api/videos/{task_id}.mp4"
            response.video_url = video_url
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
