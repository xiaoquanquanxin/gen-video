'use client';

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  resolution?: string;
  duration?: number;
}

export default function VideoPlayer({ src, resolution, duration }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(false);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600 mb-4">视频加载失败</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <span className="text-white text-xs">加载中...</span>
        </div>
      )}
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full"
        onError={handleError}
        onLoadedData={handleLoadedData}
      />
      {(resolution || duration) && (
        <div className="bg-gray-900 px-2 py-1 flex gap-3 text-xs text-gray-400">
          {resolution && <span>{resolution}</span>}
          {duration && <span>{duration}s</span>}
        </div>
      )}
    </div>
  );
}
