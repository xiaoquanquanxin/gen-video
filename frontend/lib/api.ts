const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface GenerateRequest {
  mode: 'text-to-video' | 'image-to-video';
  prompt: string;
  image_url?: string | null;
  end_image_url?: string | null;
  aspect_ratio: string;
  resolution: string;
  duration: number;
  camera_fixed: boolean;
  seed: number;
  generate_audio: boolean;
  enable_safety_checker: boolean;
}

export interface GenerateResponse {
  success: boolean;
  task_id?: string;
  error?: string;
}

export interface StatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  video_url?: string;
  local_path?: string;
  error?: string;
}

export interface HistoryRecord {
  task_id: string;
  mode: string;
  prompt: string;
  image_url?: string | null;
  end_image_url?: string | null;
  aspect_ratio: string;
  resolution: string;
  duration: number;
  camera_fixed?: boolean;
  seed?: number;
  generate_audio?: boolean;
  enable_safety_checker?: boolean;
  local_path?: string;
  created_at: string;
}

export interface HistoryResponse {
  records: HistoryRecord[];
}

export const api = {
  async generate(params: GenerateRequest): Promise<GenerateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '生成失败');
    }
    
    return response.json();
  },

  async getStatus(taskId: string): Promise<StatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/status/${taskId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取状态失败');
    }
    
    return response.json();
  },

  async getHistory(): Promise<HistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/api/history`);
    
    if (!response.ok) {
      throw new Error('获取历史记录失败');
    }
    
    return response.json();
  },

  getVideoUrl(localPath: string): string {
    return `${API_BASE_URL}${localPath}`;
  }
};
