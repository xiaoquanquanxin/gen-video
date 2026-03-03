import os
import json
import aiofiles
from typing import List, Optional
from datetime import datetime

class HistoryStore:
    def __init__(self, history_file: str = "../videos/history.json"):
        self.history_file = history_file
        self._ensure_directory()
    
    def _ensure_directory(self):
        """确保目录存在"""
        dir_path = os.path.dirname(self.history_file)
        if dir_path:
            os.makedirs(dir_path, exist_ok=True)
    
    async def add_record(self, record: dict) -> None:
        """添加历史记录"""
        records = await self.get_records()
        record['created_at'] = datetime.now().isoformat()
        records.insert(0, record)  # 新记录插入到最前面
        
        async with aiofiles.open(self.history_file, 'w', encoding='utf-8') as f:
            await f.write(json.dumps({"records": records}, ensure_ascii=False, indent=2))
    
    async def get_records(self) -> List[dict]:
        """获取所有历史记录（按时间降序）"""
        if not os.path.exists(self.history_file):
            return []
        
        try:
            async with aiofiles.open(self.history_file, 'r', encoding='utf-8') as f:
                content = await f.read()
                if not content.strip():
                    return []
                data = json.loads(content)
                records = data.get("records", [])
                # 确保按时间降序排列
                records.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                return records
        except (json.JSONDecodeError, IOError):
            return []
    
    async def get_record_by_task_id(self, task_id: str) -> Optional[dict]:
        """根据 task_id 获取记录"""
        records = await self.get_records()
        for record in records:
            if record.get('task_id') == task_id:
                return record
        return None

# 单例实例
history_store = HistoryStore()
