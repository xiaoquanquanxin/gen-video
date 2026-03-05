from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# 加载环境变量
load_dotenv(override=True)

# 导入路由
from routers import generate, status, history, videos

app = FastAPI(title="Seedance Video API", version="1.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3456"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(generate.router)
app.include_router(status.router)
app.include_router(history.router)
app.include_router(videos.router)

@app.get("/")
async def root():
    return {"message": "Seedance Video API is running"}

@app.get("/health")
async def health():
    ark_key = os.environ.get("ARK_API_KEY")
    return {
        "status": "healthy",
        "ark_configured": bool(ark_key and ark_key != "your_api_key_here")
    }
