from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
import asyncio

app = FastAPI()

API_KEY = os.getenv("API_KEY", "default-secret")

security = HTTPBearer()

# --- Auth Dependency ---
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

# --- MCP Resources Registry ---
async def get_status():
    async with httpx.AsyncClient() as client:
        r = await client.get("http://api-server:8080/status")
        return r.json()

async def send_test_data(params):
    async with httpx.AsyncClient() as client:
        r = await client.post("http://api-server:8080/test", json=params)
        return r.json()

# --- Rust API Integration ---
# --- Ollama Integration ---
async def ollama_generate(params):
    async with httpx.AsyncClient() as client:
        r = await client.post("http://ollama:11434/generate", json=params)
        return r.json()

# --- Mistral-Nemo Integration ---
async def mistral_nemo_infer(params):
    async with httpx.AsyncClient() as client:
        r = await client.post("http://mistral-nemo:12345/infer", json=params)
        return r.json()
async def rust_health(params=None):
    async with httpx.AsyncClient() as client:
        r = await client.get("http://rust-api:8000/health")
        return r.json()

async def rust_echo(params):
    async with httpx.AsyncClient() as client:
        r = await client.post("http://rust-api:8000/api/v1/echo", json=params)
        return r.json()

resources = {
    "getStatus": {
        "description": "Get status from API server",
        "call": get_status
    },
    "testData": {
        "description": "Send test data to API server",
        "call": send_test_data
    },
    "rustHealth": {
        "description": "Get health from Rust API",
        "call": rust_health
    },
    "rustEcho": {
        "description": "Echo data to Rust API",
        "call": rust_echo
    },
    "ollamaGenerate": {
        "description": "Generate text with Ollama",
        "call": ollama_generate
    },
    "mistralNemoInfer": {
        "description": "Infer with Mistral-Nemo",
        "call": mistral_nemo_infer
    }
}

# --- Endpoints ---
@app.get("/")
async def list_resources(user: str = Depends(verify_token)):
    return {
        "mcp": "ok",
        "resources": [
            {"name": name, "description": res["description"]}
            for name, res in resources.items()
        ]
    }

@app.post("/resource/{name}")
async def call_resource(name: str, request: Request, user: str = Depends(verify_token)):
    if name not in resources:
        raise HTTPException(status_code=404, detail="Unknown resource")
    try:
        params = await request.json()
    except:
        params = {}
    try:
        result = await resources[name]["call"](params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
