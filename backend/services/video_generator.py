import os
import base64
import httpx
from typing import Optional, Literal
from dataclasses import dataclass

@dataclass
class GenerationParams:
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

class VideoGenerator:
    """火山引擎方舟 Seedance 视频生成服务"""
    
    # Seedance 模型 ID（根据火山引擎方舟文档）
    TEXT_TO_VIDEO_MODEL = "doubao-seedance-1-5-pro-251215"
    IMAGE_TO_VIDEO_MODEL = "doubao-seedance-1-5-pro-251215"
    
    def __init__(self):
        self.api_key = os.environ.get("ARK_API_KEY")
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"
    
    def _check_api_key(self):
        if not self.api_key or self.api_key == "your_api_key_here":
            raise ValueError("ARK_API_KEY 环境变量未配置")

    def _get_headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def _to_data_url(self, image_url: str) -> str:
        """将本地图片 URL 转为 base64 data URL"""
        if image_url.startswith("data:"):
            return image_url
        # 本地上传的图片，从文件系统读取
        if "localhost" in image_url or "127.0.0.1" in image_url:
            # 从 URL 提取文件名: http://localhost:8000/uploads/xxx.jpg -> ../uploads/xxx.jpg
            filename = image_url.split("/uploads/")[-1]
            filepath = os.path.join("../uploads", filename)
            if os.path.exists(filepath):
                with open(filepath, "rb") as f:
                    data = base64.b64encode(f.read()).decode()
                ext = filename.rsplit(".", 1)[-1].lower()
                mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}.get(ext, "image/jpeg")
                return f"data:{mime};base64,{data}"
        return image_url

    def _build_content(self, params: GenerationParams) -> list:
        """构建请求内容"""
        content = []
        
        # 构建参数文本
        param_parts = []
        param_parts.append(f"--aspect_ratio {params.aspect_ratio}")
        param_parts.append(f"--resolution {params.resolution}")
        param_parts.append(f"--duration {params.duration}")
        if params.camera_fixed:
            param_parts.append("--camera_fixed true")
        if params.seed != -1:
            param_parts.append(f"--seed {params.seed}")
        if params.generate_audio:
            param_parts.append("--generate_audio true")
        else:
            param_parts.append("--generate_audio false")
        if not params.enable_safety_checker:
            param_parts.append("--enable_safety_checker false")
        
        # 添加 prompt
        full_text = f"{params.prompt}\n{' '.join(param_parts)}"
        content.append({
            "type": "text",
            "text": full_text
        })
        
        # 图生视频模式：添加首帧图片
        if params.mode == 'image-to-video' and params.image_url:
            content.append({
                "type": "image_url",
                "image_url": {"url": self._to_data_url(params.image_url)}
            })
        
        # 添加尾帧图片（如果有）
        if params.end_image_url:
            content.append({
                "type": "image_url", 
                "image_url": {"url": self._to_data_url(params.end_image_url)}
            })
        
        return content
    
    async def generate(self, params: GenerationParams) -> dict:
        """发起视频生成任务"""
        self._check_api_key()
        
        model = self.IMAGE_TO_VIDEO_MODEL if params.mode == 'image-to-video' else self.TEXT_TO_VIDEO_MODEL
        
        payload = {
            "model": model,
            "content": self._build_content(params)
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/contents/generations/tasks",
                headers=self._get_headers(),
                json=payload
            )
            
            if response.status_code != 200:
                error_text = response.text
                raise Exception(f"创建任务失败: {response.status_code} - {error_text}")
            
            data = response.json()
            return {"task_id": data.get("id")}

    async def get_status(self, task_id: str) -> dict:
        """查询任务状态"""
        self._check_api_key()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/contents/generations/tasks/{task_id}",
                headers=self._get_headers()
            )
            
            if response.status_code == 404:
                return {"status": "FAILED", "error": "任务不存在"}
            
            if response.status_code != 200:
                return {"status": "FAILED", "error": f"查询失败: {response.status_code}"}
            
            data = response.json()
            status = data.get("status", "unknown")
            
            # 映射状态
            status_map = {
                "queued": "IN_QUEUE",
                "running": "IN_PROGRESS",
                "succeeded": "COMPLETED",
                "failed": "FAILED",
                "cancelled": "FAILED"
            }
            
            mapped_status = status_map.get(status, "IN_PROGRESS")
            
            result = {
                "status": mapped_status,
                "progress": self._estimate_progress(status)
            }
            
            if mapped_status == "COMPLETED":
                content = data.get("content", {})
                video_url = content.get("video_url")
                if video_url:
                    result["video_url"] = video_url
            
            if mapped_status == "FAILED":
                error = data.get("error", {})
                result["error"] = error.get("message", "生成失败")
            
            return result
    
    def _estimate_progress(self, status: str) -> int:
        """估算进度百分比"""
        progress_map = {
            "queued": 10,
            "running": 50,
            "succeeded": 100,
            "failed": 0,
            "cancelled": 0
        }
        return progress_map.get(status, 30)

# 单例实例
video_generator = VideoGenerator()
