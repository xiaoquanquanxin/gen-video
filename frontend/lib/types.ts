// 画面比例
export type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | 'auto';

// 分辨率
export type Resolution = '480p' | '720p' | '1080p';

// 任务状态
export type TaskStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// 生成模式
export type GenerationMode = 'text-to-video' | 'image-to-video';

// 表单状态
export interface FormState {
  mode: GenerationMode;
  title: string;
  description: string;
  prompt: string;
  imageUrl: string | null;
  endImageUrl: string | null;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number;
  cameraFixed: boolean;
  seed: number;
  generateAudio: boolean;
  enableSafetyChecker: boolean;
}

// 默认表单状态
export const defaultFormState: FormState = {
  mode: 'text-to-video',
  title: '',
  description: '',
  prompt: '',
  imageUrl: null,
  endImageUrl: null,
  aspectRatio: '16:9',
  resolution: '480p',
  duration: 5,
  cameraFixed: false,
  seed: -1,
  generateAudio: false,
  enableSafetyChecker: false,
};

// 任务
export interface Task {
  id: string;
  status: TaskStatus;
  progress: number;
  videoUrl?: string;
  localPath?: string;
  error?: string;
}

// 历史记录
export interface HistoryRecord {
  taskId: string;
  mode: GenerationMode;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number;
  localPath: string;
  createdAt: string;
}

// 视频生成结果
export interface VideoResult {
  taskId: string;
  videoUrl: string;
  localPath: string;
}
