'use client';

import { useState } from 'react';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
}

interface SessionTabsProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onRenameSession: (id: string, name: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function SessionTabs({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
}: SessionTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id);
    setEditName(session.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameSession(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-gray-900 text-white">
      <div className="flex items-center overflow-x-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-center gap-2 px-4 py-3 border-r border-gray-700 cursor-pointer min-w-[120px] max-w-[200px] ${
              activeSessionId === session.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            {editingId === session.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="bg-gray-700 px-2 py-1 rounded text-sm w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="text-sm truncate flex-1">{session.name}</span>
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}
                    className="text-gray-400 hover:text-white text-xs"
                    title="重命名"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="text-gray-400 hover:text-red-400 text-xs"
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        
        <button
          onClick={onNewSession}
          className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
          title="新建会话"
        >
          + 新建
        </button>
      </div>
    </div>
  );
}
