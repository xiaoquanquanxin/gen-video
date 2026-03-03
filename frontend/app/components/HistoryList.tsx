'use client';

import { HistoryRecord } from '@/lib/api';

interface HistoryListProps {
  records: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncatePrompt(prompt: string, maxLength: number = 50): string {
  if (prompt.length <= maxLength) return prompt;
  return prompt.slice(0, maxLength) + '...';
}

export default function HistoryList({ records, onSelect }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <h3 className="px-4 py-3 border-b border-gray-200 font-medium text-gray-700">
        历史记录
      </h3>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {records.map((record) => (
          <div
            key={record.task_id}
            onClick={() => onSelect(record)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                record.mode === 'text-to-video' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {record.mode === 'text-to-video' ? '文生视频' : '图生视频'}
              </span>
              <span className="text-xs text-gray-400">
                {formatDate(record.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {truncatePrompt(record.prompt)}
            </p>
            <div className="flex gap-2 mt-1 text-xs text-gray-400">
              <span>{record.resolution}</span>
              <span>·</span>
              <span>{record.aspect_ratio}</span>
              <span>·</span>
              <span>{record.duration}秒</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
