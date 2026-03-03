# Implementation Plan: Seedance Video App

## Overview

基于前后端分离架构实现 Seedance 视频生成应用。前端使用 Next.js 14 + Tailwind CSS，后端使用 FastAPI + volcenginesdkarkruntime。实现图生视频和文生视频两种模式，支持完整参数配置、实时进度显示、视频保存和历史记录功能。

## Tasks

- [x] 1. 项目初始化和基础结构搭建
  - [x] 1.1 创建 Next.js 14 前端项目
    - 初始化 Next.js 14 项目，配置 App Router
    - 安装 Tailwind CSS 并配置
    - 创建基础目录结构：app/components/, lib/
    - 配置 .env.local 环境变量模板
    - _Requirements: 9.1_

  - [x] 1.2 创建 FastAPI 后端项目
    - 初始化 Python 项目结构
    - 创建 main.py 入口文件
    - 创建 routers/ 和 services/ 目录
    - 配置 requirements.txt 依赖
    - 配置 CORS 允许前端访问
    - 创建 .env 环境变量模板
    - _Requirements: 9.1_

- [x] 2. 后端核心服务实现
  - [x] 2.1 实现 VideoStorage 服务
    - 创建 services/video_storage.py
    - 实现 ensure_directory() 确保 videos/ 目录存在
    - 实现 download_and_save() 下载视频并保存为 {taskId}.mp4
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 2.2 实现 HistoryStore 服务
    - 创建 services/history_store.py
    - 实现 add_record() 添加历史记录
    - 实现 get_records() 获取所有记录（按时间降序）
    - 处理 history.json 不存在的情况
    - _Requirements: 6.3, 8.4, 8.5_

  - [ ]* 2.3 编写 HistoryStore 属性测试
    - **Property 16: 历史记录按时间降序排列**
    - **Validates: Requirements 8.4**

  - [x] 2.4 实现 VideoGenerator 服务
    - 创建 services/video_generator.py
    - 初始化 volcenginesdkarkruntime Ark 客户端
    - 实现 generate() 方法调用火山方舟 Seedance API
    - 实现 get_status() 方法查询任务状态
    - 根据 mode 选择 text-to-video 或 image-to-video endpoint
    - _Requirements: 9.2, 9.3_

- [x] 3. 后端 API 路由实现
  - [x] 3.1 实现图片上传接口 POST /api/upload
    - 创建 routers/upload.py
    - 验证文件格式（JPEG/PNG/WebP）
    - 验证文件大小（≤10MB）
    - 保存图片到 uploads/ 目录并返回可访问 URL
    - _Requirements: 3.1, 3.2, 3.3, 9.4_

  - [ ]* 3.2 编写图片上传属性测试
    - **Property 5: 图片格式验证**
    - **Property 6: 图片大小验证**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 3.3 实现视频生成接口 POST /api/generate
    - 创建 routers/generate.py
    - 定义 GenerateRequest Pydantic 模型
    - 验证请求参数
    - 调用 VideoGenerator 服务发起任务
    - 返回 task_id
    - _Requirements: 4.3, 4.4, 9.2_

  - [x] 3.4 实现状态查询接口 GET /api/status/{task_id}
    - 创建 routers/status.py
    - 查询火山方舟任务状态
    - 任务完成时触发视频下载和历史记录保存
    - 返回标准化状态响应
    - _Requirements: 5.1, 5.5, 9.3_

  - [x] 3.5 实现历史记录接口 GET /api/history
    - 创建 routers/history.py
    - 调用 HistoryStore 获取记录
    - 返回历史记录列表
    - _Requirements: 8.1, 9.5_

  - [x] 3.6 实现视频文件访问接口 GET /api/videos/{filename}
    - 创建 routers/videos.py
    - 返回本地视频文件
    - _Requirements: 7.1_

  - [x] 3.7 实现 ARK_API_KEY 环境变量检查
    - 在所有 API 路由中检查环境变量
    - 未配置时返回 HTTP 500 错误
    - _Requirements: 9.6_

- [x] 4. Checkpoint - 后端功能验证
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 前端 API Client 实现
  - [x] 5.1 创建 API 调用封装
    - 创建 lib/api.ts
    - 实现 upload(), generate(), getStatus(), getHistory(), getVideo() 方法
    - 配置 API_BASE_URL 从环境变量读取
    - _Requirements: 4.3, 5.1, 8.1_

- [x] 6. 前端类型定义
  - [x] 6.1 创建 TypeScript 类型定义
    - 创建 lib/types.ts
    - 定义 AspectRatio, Resolution, TaskStatus, GenerationMode 类型
    - 定义 FormState, Task, HistoryRecord, VideoResult 接口
    - _Requirements: 2.4, 2.5_

- [x] 7. 前端核心组件实现
  - [x] 7.1 实现 GenerationForm 组件
    - 创建 app/components/GenerationForm.tsx
    - 实现模式切换控件（图生视频/文生视频）
    - 实现 prompt 多行文本输入（最大 2000 字符）
    - 实现图片上传控件（首帧和可选尾帧）
    - 实现所有参数配置控件
    - 实现表单验证逻辑
    - 实现生成按钮状态控制
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1-2.10, 4.1, 4.2, 4.5_

  - [ ]* 7.2 编写 GenerationForm 属性测试
    - **Property 1: 模式切换保持共享参数不变**
    - **Property 2: 模式决定图片上传区域可见性**
    - **Property 3: Prompt 长度限制**
    - **Property 4: 参数默认值正确性**
    - **Property 8: 表单验证阻止无效提交**
    - **Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.4-2.10, 4.1, 4.2**

  - [x] 7.3 实现图片上传组件
    - 创建 app/components/ImageUploader.tsx
    - 实现文件选择和拖拽上传
    - 实现格式和大小验证
    - 实现缩略图预览
    - 实现删除功能
    - _Requirements: 3.1-3.5_

  - [x] 7.4 实现 ProgressDisplay 组件
    - 创建 app/components/ProgressDisplay.tsx
    - 实现进度条和百分比显示
    - 实现状态文字显示（排队中/生成中）
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 7.5 编写 ProgressDisplay 属性测试
    - **Property 11: 进度值正确显示**
    - **Property 12: 任务状态正确映射显示文字**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

  - [x] 7.6 实现 VideoPlayer 组件
    - 创建 app/components/VideoPlayer.tsx
    - 实现播放、暂停、进度拖拽、音量调节、全屏控制
    - 显示分辨率和时长信息
    - 实现加载失败处理和重试
    - _Requirements: 7.1-7.4_

  - [x] 7.7 实现 HistoryList 组件
    - 创建 app/components/HistoryList.tsx
    - 实现卡片列表渲染
    - 显示生成时间、模式、prompt 前 50 字符
    - 实现点击播放功能
    - 处理空状态显示
    - _Requirements: 8.1-8.6_

- [x] 8. 前端页面集成
  - [x] 8.1 实现主页面
    - 编辑 app/page.tsx
    - 集成所有组件
    - 实现轮询逻辑（每 3 秒）
    - 实现连续失败 3 次停止轮询
    - 实现错误处理和显示
    - 页面加载时自动请求历史记录
    - _Requirements: 4.4, 4.6, 5.1, 5.6, 8.6_

- [x] 9. Checkpoint - 前端功能验证
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. 集成和完善
  - [x] 10.1 前后端联调
    - 验证所有 API 接口正常工作
    - 验证完整视频生成流程
    - 验证历史记录功能
    - _Requirements: 4.3, 4.4, 5.1, 6.1-6.4, 8.1_

  - [ ]* 10.2 编写端到端测试
    - 测试完整视频生成流程
    - 测试模式切换
    - 测试历史记录加载和播放
    - _Requirements: 1.1-1.4, 4.3-4.6_

- [x] 11. Final Checkpoint - 完整功能验证
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 前端使用 TypeScript，后端使用 Python
- 默认值已更新：generate_audio=false, enable_safety_checker=false
- 火山方舟 API Base URL: https://ark.cn-beijing.volces.com/api/v3
- 环境变量：前端 NEXT_PUBLIC_API_URL，后端 ARK_API_KEY
