# Requirements Document

## Introduction

本项目是一个基于 Next.js 14 + Tailwind CSS 的图文生视频 Web 应用，集成 fal.ai 托管的 Seedance 1.5 Pro（字节跳动官方模型）API，支持图生视频（image-to-video）和文生视频（text-to-video）两种模式。用户可在前端完整配置所有 API 参数，实时查看生成进度，生成完成后视频保存至本地并可直接播放，同时支持历史记录浏览。

## API Platform

- **平台**: fal.ai（官方托管 Seedance 1.5 Pro）
- **text-to-video endpoint**: `fal-ai/bytedance/seedance/v1.5/pro/text-to-video`
- **image-to-video endpoint**: `fal-ai/bytedance/seedance/v1.5/pro/image-to-video`
- **环境变量**: `FAL_KEY`
- **SDK**: `@fal-ai/client` (Node.js)

## Glossary

- **App**：整个 Next.js Web 应用
- **VideoGenerator**：负责调用 fal.ai API 发起视频生成任务的后端模块（API Route）
- **ProgressPoller**：负责轮询 fal.ai 任务状态并向前端推送进度的后端模块
- **VideoStorage**：负责将生成完成的视频文件下载并保存至 `public/videos/` 目录的模块
- **HistoryStore**：负责维护本地视频历史记录（JSON 文件）的模块
- **GenerationForm**：前端参数配置表单组件
- **VideoPlayer**：前端视频播放组件
- **HistoryList**：前端历史记录列表组件
- **Task**：一次视频生成任务，包含参数、状态、结果信息
- **image-to-video 模式**：以图片为首帧（可选尾帧）生成视频的模式
- **text-to-video 模式**：仅凭文字提示词生成视频的模式

---

## Requirements

### Requirement 1: 模式选择

**User Story:** As a 用户, I want 在图生视频和文生视频两种模式之间切换, so that 我可以根据需要选择合适的生成方式。

#### Acceptance Criteria

1. THE App SHALL 在页面顶部提供模式切换控件，选项为 "图生视频（image-to-video）" 和 "文生视频（text-to-video）"。
2. WHEN 用户选择 "图生视频" 模式, THE GenerationForm SHALL 显示首帧图片上传区域和可选尾帧图片上传区域。
3. WHEN 用户选择 "文生视频" 模式, THE GenerationForm SHALL 隐藏图片上传区域，仅显示文字提示词输入框。
4. WHEN 用户切换模式, THE GenerationForm SHALL 保留已填写的 prompt、aspect_ratio、resolution、duration、camera_fixed、seed、generate_audio、enable_safety_checker 参数值不变。

---

### Requirement 2: 参数配置

**User Story:** As a 用户, I want 在前端完整配置所有 API 参数, so that 我可以精确控制视频生成效果。

#### Acceptance Criteria

1. THE GenerationForm SHALL 提供 prompt 文本输入框，支持多行输入，最大长度为 2000 个字符。
2. WHEN 当前模式为 "图生视频", THE GenerationForm SHALL 提供 image_url 图片上传控件，支持上传 JPEG、PNG、WebP 格式文件。
3. WHEN 当前模式为 "图生视频", THE GenerationForm SHALL 提供 end_image_url 图片上传控件，标注为可选，支持上传 JPEG、PNG、WebP 格式文件。
4. THE GenerationForm SHALL 提供 aspect_ratio 下拉选择控件，选项为 21:9、16:9、4:3、1:1、3:4、9:16、auto，默认值为 16:9。
5. THE GenerationForm SHALL 提供 resolution 下拉选择控件，选项为 480p、720p、1080p，默认值为 720p。
6. THE GenerationForm SHALL 提供 duration 数字滑块控件，范围为 4 到 12（单位：秒），步长为 1，默认值为 5。
7. THE GenerationForm SHALL 提供 camera_fixed 开关控件，默认值为 false。
8. THE GenerationForm SHALL 提供 seed 数字输入框，接受 -1（随机）或非负整数，默认值为 -1。
9. THE GenerationForm SHALL 提供 generate_audio 开关控件，默认值为 false。
10. THE GenerationForm SHALL 提供 enable_safety_checker 开关控件，默认值为 false。

---

### Requirement 3: 图片上传

**User Story:** As a 用户, I want 上传本地图片作为首帧或尾帧, so that 我可以以自己的图片为基础生成视频。

#### Acceptance Criteria

1. WHEN 用户选择图片文件, THE App SHALL 将图片上传至 `/api/upload` 接口并返回可访问的图片 URL。
2. IF 上传的文件格式不是 JPEG、PNG 或 WebP, THEN THE App SHALL 显示错误提示 "仅支持 JPEG、PNG、WebP 格式图片"，并拒绝上传。
3. IF 上传的文件大小超过 10MB, THEN THE App SHALL 显示错误提示 "图片大小不能超过 10MB"，并拒绝上传。
4. WHEN 图片上传成功, THE GenerationForm SHALL 显示图片缩略图预览。
5. WHEN 用户点击已上传图片的删除按钮, THE GenerationForm SHALL 清除该图片并恢复上传控件。

---

### Requirement 4: 发起生成任务

**User Story:** As a 用户, I want 点击生成按钮发起视频生成任务, so that 我可以获得生成的视频。

#### Acceptance Criteria

1. WHEN 当前模式为 "图生视频" 且用户未上传首帧图片, THE GenerationForm SHALL 禁用生成按钮并显示提示 "请上传首帧图片"。
2. WHEN 当前模式为 "文生视频" 且 prompt 为空, THE GenerationForm SHALL 禁用生成按钮并显示提示 "请输入提示词"。
3. WHEN 用户点击生成按钮, THE App SHALL 向 `/api/generate` 发送包含所有参数的 POST 请求。
4. WHEN 生成任务发起成功, THE App SHALL 返回 task_id 并立即开始轮询任务状态。
5. WHILE 生成任务进行中, THE GenerationForm SHALL 禁用生成按钮，防止重复提交。
6. IF `/api/generate` 返回错误, THEN THE App SHALL 在页面上显示具体错误信息，并重新启用生成按钮。

---

### Requirement 5: 实时进度显示

**User Story:** As a 用户, I want 实时查看视频生成进度, so that 我了解任务当前状态，无需手动刷新页面。

#### Acceptance Criteria

1. WHILE 生成任务进行中, THE ProgressPoller SHALL 每 3 秒向 `/api/status/[taskId]` 发送一次轮询请求。
2. WHILE 生成任务进行中, THE App SHALL 在页面上显示进度条和百分比数值（0%–100%）。
3. WHEN fal.ai 返回任务状态为 IN_QUEUE, THE App SHALL 显示状态文字 "排队中..."。
4. WHEN fal.ai 返回任务状态为 IN_PROGRESS, THE App SHALL 显示状态文字 "生成中..." 及当前进度百分比。
5. WHEN fal.ai 返回任务状态为 COMPLETED, THE ProgressPoller SHALL 停止轮询并触发视频保存流程。
6. IF 连续 3 次轮询请求失败, THEN THE App SHALL 停止轮询并显示错误提示 "获取进度失败，请刷新页面重试"。

---

### Requirement 6: 视频保存

**User Story:** As a 用户, I want 生成完成的视频自动保存到本地, so that 我可以随时访问和播放已生成的视频。

#### Acceptance Criteria

1. WHEN 生成任务状态变为 COMPLETED, THE VideoStorage SHALL 从 fal.ai 返回的视频 URL 下载视频文件。
2. THE VideoStorage SHALL 将视频文件保存至 `public/videos/` 目录，文件名格式为 `{taskId}.mp4`。
3. WHEN 视频文件保存成功, THE HistoryStore SHALL 将本次任务记录（task_id、prompt、模式、参数、文件路径、生成时间）追加写入 `public/videos/history.json`。
4. IF 视频下载失败, THEN THE App SHALL 显示错误提示 "视频保存失败，请重试"，并保留 fal.ai 原始视频 URL 供用户手动下载。
5. IF `public/videos/` 目录不存在, THEN THE VideoStorage SHALL 自动创建该目录。

---

### Requirement 7: 视频播放

**User Story:** As a 用户, I want 生成完成后直接在页面上播放视频, so that 我可以立即预览生成结果。

#### Acceptance Criteria

1. WHEN 视频保存成功, THE VideoPlayer SHALL 自动出现在页面上并加载本地视频文件。
2. THE VideoPlayer SHALL 提供播放、暂停、进度拖拽、音量调节、全屏控制功能。
3. THE VideoPlayer SHALL 显示视频的分辨率、时长信息。
4. WHEN 视频加载失败, THE VideoPlayer SHALL 显示错误提示 "视频加载失败" 并提供重新加载按钮。

---

### Requirement 8: 历史记录

**User Story:** As a 用户, I want 查看所有已生成的视频历史记录, so that 我可以回顾和重新播放之前生成的视频。

#### Acceptance Criteria

1. THE HistoryList SHALL 从 `/api/history` 接口加载历史记录，并在页面上以卡片列表形式展示。
2. THE HistoryList SHALL 为每条历史记录显示：视频缩略图（取第一帧）、生成时间、模式（图生视频/文生视频）、prompt 前 50 个字符。
3. WHEN 用户点击历史记录卡片, THE VideoPlayer SHALL 加载并播放对应的本地视频文件。
4. THE HistoryList SHALL 按生成时间降序排列，最新生成的视频排在最前。
5. WHEN `public/videos/history.json` 不存在或为空, THE HistoryList SHALL 显示提示文字 "暂无历史记录"。
6. THE App SHALL 在页面加载时自动请求 `/api/history` 并渲染历史列表。

---

### Requirement 9: API 路由

**User Story:** As a 开发者, I want 后端 API 路由正确封装 fal.ai 调用逻辑, so that 前端无需直接暴露 API 密钥。

#### Acceptance Criteria

1. THE App SHALL 从环境变量 `FAL_KEY` 读取 fal.ai API 密钥，不得在前端代码中硬编码。
2. THE VideoGenerator SHALL 实现 `POST /api/generate` 接口，接收前端参数，根据模式调用 fal.ai `fal-ai/bytedance/seedance/v1.5/pro/text-to-video` 或 `fal-ai/bytedance/seedance/v1.5/pro/image-to-video` 模型，返回 task_id。
3. THE ProgressPoller SHALL 实现 `GET /api/status/[taskId]` 接口，查询 fal.ai 任务状态并返回标准化的进度信息。
4. THE App SHALL 实现 `POST /api/upload` 接口，接收图片文件，上传至 fal.ai storage 并返回图片 URL。
5. THE App SHALL 实现 `GET /api/history` 接口，读取 `public/videos/history.json` 并返回历史记录列表。
6. IF `FAL_KEY` 环境变量未设置, THEN THE App SHALL 在所有 API 路由中返回 HTTP 500 错误及提示 "FAL_KEY 环境变量未配置"。
