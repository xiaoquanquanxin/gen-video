'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FormState, Task, defaultFormState } from '@/lib/types';
import { api, HistoryRecord } from '@/lib/api';
import GenerationForm from './components/GenerationForm';
import ProgressDisplay from './components/ProgressDisplay';
import VideoPlayer from './components/VideoPlayer';
import HistoryList from './components/HistoryList';

export default function Home() {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; resolution?: string; duration?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const pollFailCount = useRef(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 加载历史记录
  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getHistory();
      setHistory(data.records);
      return data.records;
    } catch (err) {
      console.error('加载历史记录失败:', err);
      return [];
    }
  }, []);

  // 页面加载时检查未完成的任务
  useEffect(() => {
    const init = async () => {
      const records = await loadHistory();
      // 找到第一个未完成的任务
      const pendingTask = records.find(r => r.status === 'pending' || r.status === 'running');
      if (pendingTask) {
        setCurrentTask({ id: pendingTask.task_id, status: 'IN_PROGRESS', progress: 0 });
        setIsGenerating(true);
        startPolling(pendingTask.task_id);
      }
    };
    init();
  }, []);

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
      
      setCurrentTask(task);

      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setIsGenerating(false);
        
        if (status.status === 'COMPLETED' && status.local_path) {
          setSelectedVideo({ url: api.getVideoUrl(status.local_path) });
          loadHistory();
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
  }, [loadHistory]);

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
  const handleSubmit = async (form: FormState) => {
    setError(null);
    setIsGenerating(true);
    setCurrentTask(null);
    setSelectedVideo(null);
    setFormState(form);

    try {
      const result = await api.generate({
        mode: form.mode,
        title: form.title,
        description: form.description,
        prompt: form.prompt,
        image_url: form.imageUrl,
        end_image_url: form.endImageUrl,
        aspect_ratio: form.aspectRatio,
        resolution: form.resolution,
        duration: form.duration,
        camera_fixed: form.cameraFixed,
        seed: form.seed,
        generate_audio: form.generateAudio,
        enable_safety_checker: form.enableSafetyChecker,
      });

      if (result.success && result.task_id) {
        setCurrentTask({ id: result.task_id, status: 'IN_QUEUE', progress: 0 });
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

  const handleSelectHistory = (record: HistoryRecord) => {
    if (record.local_path) {
      setSelectedVideo({
        url: api.getVideoUrl(record.local_path),
        resolution: record.resolution,
        duration: record.duration,
      });
    }

    // 回填表单参数
    setFormState({
      mode: (record.mode as FormState['mode']) || 'text-to-video',
      title: record.title || '',
      description: record.description || '',
      prompt: record.prompt || '',
      imageUrl: record.image_url || null,
      endImageUrl: record.end_image_url || null,
      aspectRatio: (record.aspect_ratio as FormState['aspectRatio']) || '16:9',
      resolution: (record.resolution as FormState['resolution']) || '480p',
      duration: record.duration || 5,
      cameraFixed: record.camera_fixed ?? false,
      seed: record.seed ?? -1,
      generateAudio: record.generate_audio ?? false,
      enableSafetyChecker: record.enable_safety_checker ?? false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Seedance 视频生成</h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <GenerationForm 
              onSubmit={handleSubmit} 
              isGenerating={isGenerating}
              initialState={formState}
            />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
            
            {currentTask && (currentTask.status === 'IN_QUEUE' || currentTask.status === 'IN_PROGRESS') && (
              <ProgressDisplay
                status={currentTask.status}
                progress={currentTask.progress}
                error={currentTask.error}
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

          <div>
            <HistoryList records={history} onSelect={handleSelectHistory} />
          </div>
        </div>
      </main>
    </div>
  );
}
