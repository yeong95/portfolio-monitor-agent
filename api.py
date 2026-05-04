from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent
from tools.telegram_tool import send_telegram_message

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Portfolio(BaseModel):
    us_stocks: list[str]
    kr_stocks: list[str]
    send_telegram: bool = False

@app.post("/briefing")
async def get_briefing(portfolio: Portfolio):
    briefing = run_agent(portfolio.us_stocks, portfolio.kr_stocks)
    if portfolio.send_telegram:
        send_telegram_message(briefing)
    return {"briefing": briefing}

@app.get("/health")
async def health():
    return {"status": "ok"}