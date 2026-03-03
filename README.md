# Seedance 视频生成应用

基于火山引擎方舟 Seedance API 的图文生视频 Web 应用。

## 功能特性

- 支持文生视频（text-to-video）和图生视频（image-to-video）两种模式
- 完整的参数配置：画面比例、分辨率、时长、固定镜头、Seed 等
- 实时进度显示
- 视频本地保存和历史记录
- 响应式界面设计

## 技术栈

- 前端：Next.js 14 + Tailwind CSS
- 后端：FastAPI (Python)
- API：火山引擎方舟 Seedance

## 快速开始

### 1. 配置环境变量

后端 (`backend/.env`):
```
ARK_API_KEY=your_volcengine_ark_api_key
```

前端 (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. 安装依赖

后端:
```bash
cd backend
pip install -r requirements.txt
```

前端:
```bash
cd frontend
npm install
```

### 3. 启动服务

后端 (端口 8000):
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

前端 (端口 3000):
```bash
cd frontend
npm run dev
```

### 4. 访问应用

打开浏览器访问 http://localhost:3000

## 项目结构

```
seedance2/
├── frontend/          # Next.js 前端
│   ├── app/
│   │   ├── components/
│   │   └── page.tsx
│   └── lib/
├── backend/           # FastAPI 后端
│   ├── routers/
│   ├── services/
│   └── main.py
├── videos/            # 生成的视频存储
└── uploads/           # 上传的图片存储
```
