import os
import aiohttp
import aiofiles

class VideoStorage:
    def __init__(self, storage_dir: str = "../videos"):
        self.storage_dir = storage_dir
        self.ensure_directory()
    
    def ensure_directory(self):
        """确保存储目录存在"""
        os.makedirs(self.storage_dir, exist_ok=True)
    
    async def download_and_save(self, video_url: str, task_id: str) -> str:
        """
        下载视频并保存到本地
        返回: 本地文件路径
        """
        filename = f"{task_id}.mp4"
        filepath = os.path.join(self.storage_dir, filename)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(video_url) as response:
                if response.status != 200:
                    raise Exception(f"下载视频失败: HTTP {response.status}")
                async with aiofiles.open(filepath, 'wb') as f:
                    await f.write(await response.read())
        
        return filepath
    
    def get_video_path(self, task_id: str) -> str:
        """获取视频文件路径"""
        return os.path.join(self.storage_dir, f"{task_id}.mp4")
    
    def video_exists(self, task_id: str) -> bool:
        """检查视频文件是否存在"""
        return os.path.exists(self.get_video_path(task_id))

# 单例实例
video_storage = VideoStorage()
