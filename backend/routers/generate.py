from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import os

from services.video_generator import video_generator, GenerationParams
from services.history_store import history_store

router = APIRouter()

class GenerateRequest(BaseModel):
    mode: Literal['text-to-video', 'image-to-video']
    prompt: str
    image_url: Optional[str] = None
    end_image_url: Optional[str] = None
    aspect_ratio: str = "16:9"
    resolution: str = "720p"
    duration: int = 5
    camera_fixed: bool = False
    seed: int = -1
    generate_audio: bool = False
    enable_safety_checker: bool = False

class GenerateResponse(BaseModel):
    success: bool
    task_id: Optional[str] = None
    error: Optional[str] = None

def check_api_key():
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        raise HTTPException(status_code=500, detail="ARK_API_KEY 环境变量未配置")

@router.post("/api/generate", response_model=GenerateResponse)
async def generate_video(request: GenerateRequest):
    """发起视频生成任务"""
    check_api_key()
    
    # 验证参数
    if request.mode == 'image-to-video' and not request.image_url:
        raise HTTPException(status_code=400, detail="图生视频模式需要上传首帧图片")
    
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="请输入提示词")
    
    if len(request.prompt) > 2000:
        raise HTTPException(status_code=400, detail="提示词不能超过 2000 个字符")
    
    try:
        params = GenerationParams(
            mode=request.mode,
            prompt=request.prompt,
            image_url=request.image_url,
            end_image_url=request.end_image_url,
            aspect_ratio=request.aspect_ratio,
            resolution=request.resolution,
            duration=request.duration,
            camera_fixed=request.camera_fixed,
            seed=request.seed,
            generate_audio=request.generate_audio,
            enable_safety_checker=request.enable_safety_checker
        )
        
        result = await video_generator.generate(params)
        
        # 保存请求记录到历史（任务创建时）
        await history_store.add_record({
            "task_id": result["task_id"],
            "mode": request.mode,
            "prompt": request.prompt,
            "aspect_ratio": request.aspect_ratio,
            "resolution": request.resolution,
            "duration": request.duration,
            "status": "pending",
            "local_path": None
        })
        
        return GenerateResponse(success=True, task_id=result["task_id"])
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        return GenerateResponse(success=False, error=str(e))
