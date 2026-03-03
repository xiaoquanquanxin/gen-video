'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FormState, Task } from '@/lib/types';
import { api, HistoryRecord } from '@/lib/api';
import { Session, createSession, loadSessions, saveSessions, getActiveSessionId, setActiveSessionId } from '@/lib/sessions';
import SessionTabs from './components/SessionTabs';
import GenerationForm from './components/GenerationForm';
import ProgressDisplay from './components/ProgressDisplay';
import VideoPlayer from './components/VideoPlayer';
import HistoryList from './components/HistoryList';

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; resolution?: string; duration?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const pollFailCount = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前活跃会话
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // 初始化：加载会话
  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length === 0) {
      // 没有会话，创建一个默认会话
      const newSession = createSession('默认会话');
      setSessions([newSession]);
      setActiveId(newSession.id);
      setActiveSessionId(newSession.id);
    } else {
      setSessions(loaded);
      const savedActiveId = getActiveSessionId();
      if (savedActiveId && loaded.find(s => s.id === savedActiveId)) {
        setActiveId(savedActiveId);
      } else {
        setActiveId(loaded[0].id);
        setActiveSessionId(loaded[0].id);
      }
    }
  }, []);

  // 保存会话变更
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  // 更新当前会话
  const updateSession = useCallback((updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, ...updates } : s
    ));
  }, [activeSessionId]);

  // 加载会话的历史记录
  const loadSessionHistory = useCallback(async () => {
    try {
      const data = await api.getHistory();
      updateSession({ history: data.records });
    } catch (err) {
      console.error('加载历史记录失败:', err);
    }
  }, [updateSession]);

  // 切换会话时加载历史
  useEffect(() => {
    if (activeSessionId) {
      loadSessionHistory();
      setSelectedVideo(null);
      setError(null);

      // 恢复未完成任务的轮询
      const session = sessions.find(s => s.id === activeSessionId);
      if (session?.currentTask && 
          (session.currentTask.status === 'IN_QUEUE' || session.currentTask.status === 'IN_PROGRESS')) {
        setIsGenerating(true);
        startPolling(session.currentTask.id);
      }
    }
  }, [activeSessionId, loadSessionHistory]);

  // 轮询任务状态
  const pollStatus = useCallback(async (taskId: string) => {
    try {
      const status = await api.getStatus(taskId);
      pollFailCount.current = 0;
      
      const task: Task = {
        id: taskId,
        status: status.status,
        progress: status.progress,
        videoUrl: status.video_url,
        localPath: status.local_path,
        error: status.error,
      };
      
      updateSession({ currentTask: task });

      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
        
        if (status.status === 'COMPLETED' && status.local_path) {
          setSelectedVideo({ url: api.getVideoUrl(status.local_path) });
          loadSessionHistory();
        }
        
        if (status.status === 'FAILED') {
          setError(status.error || '生成失败');
        }
      }
    } catch (err) {
      pollFailCount.current++;
      if (pollFailCount.current >= 3) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
        setError('获取进度失败，请刷新页面重试');
      }
    }
  }, [updateSession, loadSessionHistory]);

  const startPolling = useCallback((taskId: string) => {
    pollFailCount.current = 0;
    pollStatus(taskId);
    pollIntervalRef.current = setInterval(() => pollStatus(taskId), 3000);
  }, [pollStatus]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // 提交生成请求
  const handleSubmit = async (formState: FormState) => {
    setError(null);
    setIsGenerating(true);
    updateSession({ currentTask: null, formState });
    setSelectedVideo(null);

    try {
      const result = await api.generate({
        mode: formState.mode,
        prompt: formState.prompt,
        image_url: formState.imageUrl,
        end_image_url: formState.endImageUrl,
        aspect_ratio: formState.aspectRatio,
        resolution: formState.resolution,
        duration: formState.duration,
        camera_fixed: formState.cameraFixed,
        seed: formState.seed,
        generate_audio: formState.generateAudio,
        enable_safety_checker: formState.enableSafetyChecker,
      });

      if (result.success && result.task_id) {
        updateSession({
          currentTask: { id: result.task_id, status: 'IN_QUEUE', progress: 0 }
        });
        startPolling(result.task_id);
      } else {
        setError(result.error || '生成失败');
        setIsGenerating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      setIsGenerating(false);
    }
  };

  // 会话管理
  const handleNewSession = () => {
    const newSession = createSession();
    setSessions(prev => [...prev, newSession]);
    setActiveId(newSession.id);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    // 停止当前轮询
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsGenerating(false);
    setActiveId(id);
    setActiveSessionId(id);
  };

  const handleRenameSession = (id: string, name: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return; // 至少保留一个会话
    
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    if (activeSessionId === id) {
      setActiveId(newSessions[0].id);
      setActiveSessionId(newSessions[0].id);
    }
  };

  const handleSelectHistory = (record: HistoryRecord) => {
    if (record.local_path) {
      setSelectedVideo({
        url: api.getVideoUrl(record.local_path),
        resolution: record.resolution,
        duration: record.duration,
      });
    }

    // 回填表单参数
    const restoredForm: FormState = {
      mode: (record.mode as FormState['mode']) || 'text-to-video',
      prompt: record.prompt || '',
      imageUrl: record.image_url || null,
      endImageUrl: record.end_image_url || null,
      aspectRatio: (record.aspect_ratio as FormState['aspectRatio']) || '16:9',
      resolution: (record.resolution as FormState['resolution']) || '720p',
      duration: record.duration || 5,
      cameraFixed: record.camera_fixed ?? false,
      seed: record.seed ?? -1,
      generateAudio: record.generate_audio ?? false,
      enableSafetyChecker: record.enable_safety_checker ?? false,
    };
    updateSession({ formState: restoredForm });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部会话标签 */}
      <SessionTabs
        sessions={sessions.map(s => ({ id: s.id, name: s.name, createdAt: s.createdAt }))}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* 标题栏 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Seedance 视频生成</h1>
          <p className="text-sm text-gray-500">基于火山引擎方舟 Seedance API</p>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeSession ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：表单和视频 */}
            <div className="lg:col-span-2 space-y-6">
              <GenerationForm 
                onSubmit={handleSubmit} 
                isGenerating={isGenerating}
                initialState={activeSession.formState}
              />
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              {activeSession.currentTask && 
               (activeSession.currentTask.status === 'IN_QUEUE' || activeSession.currentTask.status === 'IN_PROGRESS') && (
                <ProgressDisplay
                  status={activeSession.currentTask.status}
                  progress={activeSession.currentTask.progress}
                  error={activeSession.currentTask.error}
                />
              )}
              
              {selectedVideo && (
                <VideoPlayer
                  src={selectedVideo.url}
                  resolution={selectedVideo.resolution}
                  duration={selectedVideo.duration}
                />
              )}
            </div>

            {/* 右侧：历史记录 */}
            <div>
              <HistoryList 
                records={activeSession.history} 
                onSelect={handleSelectHistory} 
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">
            加载中...
          </div>
        )}
      </main>
    </div>
  );
}
