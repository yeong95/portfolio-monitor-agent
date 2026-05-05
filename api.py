import json
import sqlite3
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent
from tools.telegram_tool import send_telegram_message
from database import get_db, init_db
from auth import hash_password, verify_password, create_token, get_current_user

app = FastAPI()
init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthRequest(BaseModel):
    username: str
    password: str

class PortfolioUpdate(BaseModel):
    us_stocks: list[str]
    kr_stocks: list[str]

class BriefingRequest(BaseModel):
    us_stocks: list[str]
    kr_stocks: list[str]
    send_telegram: bool = False


@app.post("/auth/register")
def register(req: AuthRequest):
    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (req.username, hash_password(req.password)),
        )
        db.commit()
        user_id = db.execute(
            "SELECT id FROM users WHERE username = ?", (req.username,)
        ).fetchone()["id"]
        db.execute(
            "INSERT INTO portfolios (user_id, us_stocks, kr_stocks) VALUES (?, '[]', '[]')",
            (user_id,),
        )
        db.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
    finally:
        db.close()
    return {"token": create_token(user_id, req.username), "username": req.username}


@app.post("/auth/login")
def login(req: AuthRequest):
    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username = ?", (req.username,)
    ).fetchone()
    db.close()
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    return {"token": create_token(user["id"], user["username"]), "username": user["username"]}


@app.get("/portfolio")
def get_portfolio(current_user=Depends(get_current_user)):
    db = get_db()
    row = db.execute(
        "SELECT * FROM portfolios WHERE user_id = ?", (int(current_user["sub"]),)
    ).fetchone()
    db.close()
    if not row:
        return {"us_stocks": [], "kr_stocks": []}
    return {
        "us_stocks": json.loads(row["us_stocks"]),
        "kr_stocks": json.loads(row["kr_stocks"]),
    }


@app.put("/portfolio")
def save_portfolio(portfolio: PortfolioUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO portfolios (user_id, us_stocks, kr_stocks) VALUES (?, ?, ?)",
        (int(current_user["sub"]), json.dumps(portfolio.us_stocks), json.dumps(portfolio.kr_stocks)),
    )
    db.commit()
    db.close()
    return {"status": "saved"}


@app.post("/briefing")
async def get_briefing(portfolio: BriefingRequest, current_user=Depends(get_current_user)):
    briefing = await run_agent(portfolio.us_stocks, portfolio.kr_stocks)
    if portfolio.send_telegram:
        send_telegram_message(briefing)
    return {"briefing": briefing}


@app.get("/health")
def health():
    return {"status": "ok"}
