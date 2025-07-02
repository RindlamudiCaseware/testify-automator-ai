# app/api.py

from fastapi import FastAPI, Body
from orchestrator.orchestrator import send_message

app = FastAPI()

@app.post("/mcp/")
def mcp_endpoint(language: str = Body(...), action: str = Body(...), payload: dict = Body(...)):
    resp = send_message(language, action, payload)
    return resp.__dict__
