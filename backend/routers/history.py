from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from services.history_store import history_store

router = APIRouter()

class HistoryRecord(BaseModel):
    task_id: str
    mode: str
    prompt: str
    image_url: Optional[str] = None
    end_image_url: Optional[str] = None
    aspect_ratio: str
    resolution: str
    duration: int
    camera_fixed: bool = False
    seed: int = -1
    generate_audio: bool = False
    enable_safety_checker: bool = False
    local_path: Optional[str] = None
    created_at: str
    status: Optional[str] = None

class HistoryResponse(BaseModel):
    records: List[HistoryRecord]

@router.get("/api/history", response_model=HistoryResponse)
async def get_history():
    """获取历史记录"""
    records = await history_store.get_records()
    
    # 只返回已完成的记录
    completed_records = [
        HistoryRecord(
            task_id=r.get("task_id", ""),
            mode=r.get("mode", ""),
            prompt=r.get("prompt", ""),
            image_url=r.get("image_url"),
            end_image_url=r.get("end_image_url"),
            aspect_ratio=r.get("aspect_ratio", "16:9"),
            resolution=r.get("resolution", "720p"),
            duration=r.get("duration", 5),
            camera_fixed=r.get("camera_fixed", False),
            seed=r.get("seed", -1),
            generate_audio=r.get("generate_audio", False),
            enable_safety_checker=r.get("enable_safety_checker", False),
            local_path=r.get("local_path"),
            created_at=r.get("created_at", ""),
            status=r.get("status")
        )
        for r in records
        if r.get("status") == "completed" and r.get("local_path")
    ]
    
    return HistoryResponse(records=completed_records)
