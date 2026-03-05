'use client';

import { useState, useMemo } from 'react';
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

function truncatePrompt(prompt: string, maxLength: number = 40): string {
  if (prompt.length <= maxLength) return prompt;
  return prompt.slice(0, maxLength) + '...';
}

export default function HistoryList({ records, onSelect }: HistoryListProps) {
  const [themeFilter, setThemeFilter] = useState('');
  const [shotFilter, setShotFilter] = useState('');

  // 获取所有主题和分镜选项
  const themes = useMemo(() => {
    const set = new Set(records.map(r => r.theme).filter(Boolean));
    return Array.from(set).sort();
  }, [records]);

  const shots = useMemo(() => {
    const filtered = themeFilter 
      ? records.filter(r => r.theme === themeFilter)
      : records;
    const set = new Set(filtered.map(r => r.shot).filter(Boolean));
    return Array.from(set).sort();
  }, [records, themeFilter]);

  // 筛选后的记录
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (themeFilter && r.theme !== themeFilter) return false;
      if (shotFilter && r.shot !== shotFilter) return false;
      return true;
    });
  }, [records, themeFilter, shotFilter]);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 text-sm">暂无历史记录</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-3 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-700 text-sm mb-2">历史记录</h3>
        <div className="flex gap-2">
          <select
            value={themeFilter}
            onChange={(e) => { setThemeFilter(e.target.value); setShotFilter(''); }}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
          >
            <option value="">全部主题</option>
            {themes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={shotFilter}
            onChange={(e) => setShotFilter(e.target.value)}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
          >
            <option value="">全部分镜</option>
            {shots.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-4">无匹配记录</p>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.task_id}
              onClick={() => onSelect(record)}
              className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className={`text-xs px-1 py-0.5 rounded ${
                    record.mode === 'text-to-video' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {record.mode === 'text-to-video' ? '文' : '图'}
                  </span>
                  {record.status && record.status !== 'completed' && (
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      record.status === 'pending' || record.status === 'running'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {record.status === 'pending' ? '排队' : record.status === 'running' ? '生成中' : '失败'}
                    </span>
                  )}
                  {record.theme && (
                    <span className="text-xs text-gray-500">{record.theme}</span>
                  )}
                  {record.shot && (
                    <span className="text-xs font-medium text-gray-700">{record.shot}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(record.created_at)}
                </span>
              </div>
              {record.description && (
                <p className="text-xs text-gray-500 mb-0.5">{record.description}</p>
              )}
              <p className="text-xs text-gray-600 line-clamp-1">
                {truncatePrompt(record.prompt, 35)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
