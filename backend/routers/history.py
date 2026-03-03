from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from services.history_store import history_store

router = APIRouter()

class HistoryRecord(BaseModel):
    task_id: str
    mode: str
    prompt: str
    aspect_ratio: str
    resolution: str
    duration: int
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
            aspect_ratio=r.get("aspect_ratio", "16:9"),
            resolution=r.get("resolution", "720p"),
            duration=r.get("duration", 5),
            local_path=r.get("local_path"),
            created_at=r.get("created_at", ""),
            status=r.get("status")
        )
        for r in records
        if r.get("status") == "completed" and r.get("local_path")
    ]
    
    return HistoryResponse(records=completed_records)
