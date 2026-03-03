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

  // 当 initialState 变化时更新表单（切换会话时）
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* 模式切换 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">生成模式</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleModeChange('text-to-video')}
            className={`px-4 py-2 rounded-lg ${
              formState.mode === 'text-to-video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            文生视频
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('image-to-video')}
            className={`px-4 py-2 rounded-lg ${
              formState.mode === 'image-to-video'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            图生视频
          </button>
        </div>
      </div>

      {/* 图片上传（仅图生视频模式） */}
      {formState.mode === 'image-to-video' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              首帧图片 <span className="text-red-500">*</span>
            </label>
            <ImageUploader
              value={formState.imageUrl}
              onChange={(url) => updateField('imageUrl', url)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              尾帧图片（可选）
            </label>
            <ImageUploader
              value={formState.endImageUrl}
              onChange={(url) => updateField('endImageUrl', url)}
            />
          </div>
        </div>
      )}

      {/* 提示词 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          提示词 <span className="text-red-500">*</span>
          <span className="text-gray-400 ml-2">({formState.prompt.length}/2000)</span>
        </label>
        <textarea
          value={formState.prompt}
          onChange={(e) => updateField('prompt', e.target.value.slice(0, 2000))}
          placeholder="描述你想要生成的视频内容..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* 参数配置 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 画面比例 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">画面比例</label>
          <select
            value={formState.aspectRatio}
            onChange={(e) => updateField('aspectRatio', e.target.value as AspectRatio)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {aspectRatios.map(ratio => (
              <option key={ratio} value={ratio}>{ratio}</option>
            ))}
          </select>
        </div>

        {/* 分辨率 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分辨率</label>
          <select
            value={formState.resolution}
            onChange={(e) => updateField('resolution', e.target.value as Resolution)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {resolutions.map(res => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>
        </div>

        {/* 时长 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            时长: {formState.duration}秒
          </label>
          <input
            type="range"
            min={4}
            max={12}
            value={formState.duration}
            onChange={(e) => updateField('duration', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Seed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seed</label>
          <input
            type="number"
            value={formState.seed}
            onChange={(e) => updateField('seed', parseInt(e.target.value) || -1)}
            min={-1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="-1 为随机"
          />
        </div>
      </div>

      {/* 开关选项 */}
      <div className="grid grid-cols-3 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formState.cameraFixed}
            onChange={(e) => updateField('cameraFixed', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">固定镜头</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formState.generateAudio}
            onChange={(e) => updateField('generateAudio', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">生成音频</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formState.enableSafetyChecker}
            onChange={(e) => updateField('enableSafetyChecker', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-700">安全检查</span>
        </label>
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={!isValid() || isGenerating}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          isValid() && !isGenerating
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isGenerating ? '生成中...' : '开始生成'}
      </button>

      {/* 验证提示 */}
      {!isValid() && (
        <p className="text-sm text-red-500 text-center">
          {!formState.prompt.trim() && '请输入提示词'}
          {formState.mode === 'image-to-video' && !formState.imageUrl && formState.prompt.trim() && '请上传首帧图片'}
        </p>
      )}
    </form>
  );
}
