import { FormState, defaultFormState, Task } from './types';
import { HistoryRecord } from './api';

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  formState: FormState;
  currentTask: Task | null;
  history: HistoryRecord[];
}

const STORAGE_KEY = 'seedance_sessions';
const ACTIVE_SESSION_KEY = 'seedance_active_session';

// 生成唯一 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 创建新会话
export function createSession(name?: string): Session {
  const id = generateId();
  return {
    id,
    name: name || `会话 ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
    createdAt: new Date().toISOString(),
    formState: { ...defaultFormState },
    currentTask: null,
    history: [],
  };
}

// 从 localStorage 加载会话列表
export function loadSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// 保存会话列表到 localStorage
export function saveSessions(sessions: Session[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// 获取活跃会话 ID
export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

// 设置活跃会话 ID
export function setActiveSessionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}
