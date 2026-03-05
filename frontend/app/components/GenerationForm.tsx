'use client';

import { useState, useEffect } from 'react';
import { FormState, defaultFormState, AspectRatio, Resolution, GenerationMode } from '@/lib/types';
import ImageUploader from './ImageUploader';

interface GenerationFormProps {
  onSubmit: (formState: FormState) => void;
  isGenerating: boolean;
  initialState?: FormState;
}

const aspectRatios: AspectRatio[] = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16', 'auto'];
const resolutions: Resolution[] = ['480p', '720p', '1080p'];

export default function GenerationForm({ onSubmit, isGenerating, initialState }: GenerationFormProps) {
  const [formState, setFormState] = useState<FormState>(initialState || defaultFormState);

  useEffect(() => {
    if (initialState) {
      setFormState(initialState);
    }
  }, [initialState]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleModeChange = (mode: GenerationMode) => {
    setFormState(prev => ({ ...prev, mode }));
  };

  const isValid = () => {
    if (!formState.prompt.trim()) return false;
    if (formState.mode === 'image-to-video' && !formState.imageUrl) return false;
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid() && !isGenerating) {
      onSubmit(formState);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded-lg shadow text-sm">
      {/* 主题、分镜、修改说明 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">主题</label>
          <input
            type="text"
            value={formState.theme}
            onChange={(e) => updateField('theme', e.target.value)}
            placeholder="如：产品宣传片"
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">分镜</label>
          <input
            type="text"
            value={formState.shot}
            onChange={(e) => updateField('shot', e.target.value)}
            placeholder="如：A镜-开场"
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">修改说明</label>
          <input
            type="text"
            value={formState.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="如：调整镜头运动"
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('text-to-video')}
          className={`px-3 py-1 rounded text-xs ${
            formState.mode === 'text-to-video' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          文生视频
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('image-to-video')}
          className={`px-3 py-1 rounded text-xs ${
            formState.mode === 'image-to-video' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          图生视频
        </button>
      </div>

      {/* 图片上传 */}
      {formState.mode === 'image-to-video' && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              首帧 <span className="text-red-500">*</span>
            </label>
            <ImageUploader value={formState.imageUrl} onChange={(url) => updateField('imageUrl', url)} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">尾帧</label>
            <ImageUploader value={formState.endImageUrl} onChange={(url) => updateField('endImageUrl', url)} />
          </div>
        </div>
      )}

      {/* 提示词 */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          提示词 <span className="text-red-500">*</span>
          <span className="text-gray-400 ml-1">({formState.prompt.length}/2000)</span>
        </label>
        <textarea
          value={formState.prompt}
          onChange={(e) => updateField('prompt', e.target.value.slice(0, 2000))}
          placeholder="描述视频内容..."
          rows={3}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
        />
      </div>

      {/* 参数配置 */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-1">比例</label>
          <select
            value={formState.aspectRatio}
            onChange={(e) => updateField('aspectRatio', e.target.value as AspectRatio)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
          >
            {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">分辨率</label>
          <select
            value={formState.resolution}
            onChange={(e) => updateField('resolution', e.target.value as Resolution)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
          >
            {resolutions.map(res => <option key={res} value={res}>{res}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">时长 {formState.duration}s</label>
          <input
            type="range"
            min={4}
            max={12}
            value={formState.duration}
            onChange={(e) => updateField('duration', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Seed</label>
          <input
            type="text"
            value={formState.seed}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9-]/g, '');
              updateField('seed', v === '' || v === '-' ? -1 : parseInt(v));
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            placeholder="-1"
          />
        </div>
      </div>

      {/* 开关选项 */}
      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={formState.cameraFixed} onChange={(e) => updateField('cameraFixed', e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-700">固定镜头</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={formState.generateAudio} onChange={(e) => updateField('generateAudio', e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-700">生成音频</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={formState.enableSafetyChecker} onChange={(e) => updateField('enableSafetyChecker', e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-700">安全检查</span>
        </label>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={!isValid() || isGenerating}
        className={`w-full py-2 rounded font-medium text-sm ${
          isValid() && !isGenerating ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isGenerating ? '生成中...' : '开始生成'}
      </button>

      {!isValid() && (
        <p className="text-xs text-red-500 text-center">
          {!formState.prompt.trim() && '请输入提示词'}
          {formState.mode === 'image-to-video' && !formState.imageUrl && formState.prompt.trim() && '请上传首帧图片'}
        </p>
      )}
    </form>
  );
}
