'use client';

import { TaskStatus } from '@/lib/types';

interface ProgressDisplayProps {
  status: TaskStatus;
  progress: number;
  error?: string;
}

const statusText: Record<TaskStatus, string> = {
  'IN_QUEUE': '排队中...',
  'IN_PROGRESS': '生成中...',
  'COMPLETED': '已完成',
  'FAILED': '生成失败',
};

export default function ProgressDisplay({ status, progress, error }: ProgressDisplayProps) {
  const isActive = status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {statusText[status]}
        </span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'FAILED' ? 'bg-red-500' :
            status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {isActive && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          视频生成通常需要 30-120 秒，请耐心等待
        </p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
