# 📊 Portfolio Monitor Agent

LangChain Agent 기반 주식 포트폴리오 자동 모니터링 시스템.
한국/미국 종목의 주가와 뉴스를 매일 아침 텔레그램으로 브리핑합니다.

---

## 🏗️ 아키텍처

```
React 화면 (종목 선택/추가/삭제)
        ↓ (axios HTTP 요청)
FastAPI 서버 (api.py)
        ↓ (await)
LangChain Agent (agent.py)
        ↓ (MCP 프로토콜)
┌─────────────────────────────────────┐
│  stock MCP 서버                      │
│  - get_us_stock_info (yfinance)      │
│  - get_kr_stock_info (pykrx)         │
├─────────────────────────────────────┤
│  news MCP 서버                       │
│  - get_stock_news    (NewsAPI)       │
└─────────────────────────────────────┘
        ↓
브리핑 생성 (LLM 분석 및 요약)
        ↓
텔레그램 Bot 전송
```

### MCP 아키텍처를 선택한 이유

초기에는 Tool을 Agent 코드 안에 직접 구현했으나, MCP 서버로 분리하면 다음과 같은 장점이 있습니다.

- **재사용성** — 동일한 MCP 서버를 다른 Agent에서도 연결해서 사용 가능
- **독립성** — Tool 로직 변경 시 Agent 코드 수정 불필요
- **확장성** — 새로운 Tool 추가 시 MCP 서버만 수정하면 됨

---

## 🛠️ 기술 스택

| 분류 | 기술 | 선택 이유 |
|---|---|---|
| AI Framework | LangChain + LangGraph | Tool calling 기반 Agent 구현 |
| LLM | Groq (LLaMA 3.3 70B) | 무료 tier, 빠른 응답속도 |
| Agent 프로토콜 | MCP (Model Context Protocol) | Tool을 서버로 분리하여 재사용성 확보 |
| 백엔드 | FastAPI | 비동기 API 서버 |
| 프론트엔드 | React | 종목 관리 화면 |
| 주가 (미국) | yfinance | 무료 Yahoo Finance API |
| 주가 (한국) | pykrx | KRX 공식 데이터 |
| 뉴스 | NewsAPI | 글로벌 뉴스 수집 |
| 알림 | Telegram Bot API | 모바일 실시간 알림 |
| 스케줄링 | APScheduler | 경량 Python 스케줄러 |

---

## 📁 프로젝트 구조

```
portfolio-monitor/
├── main.py               # 스케줄러 (매일 오전 9시 자동 실행)
├── agent.py              # LangChain Agent + MCP 클라이언트
├── api.py                # FastAPI 서버
├── .env                  # API 키 관리
├── mcp_servers/
│   ├── stock_server.py   # 주가 수집 MCP 서버 (한국/미국)
│   └── news_server.py    # 뉴스 수집 MCP 서버
├── tools/
│   └── telegram_tool.py  # 텔레그램 전송
└── frontend/             # React 앱 (종목 선택 화면)
```

---

## ⚙️ 설치 및 실행

### 1. 패키지 설치
```bash
python -m venv venv
source venv/bin/activate
pip install langchain langchain-groq langgraph langchain-mcp-adapters
pip install fastapi uvicorn yfinance pykrx
pip install python-telegram-bot apscheduler python-dotenv
pip install beautifulsoup4 requests mcp
```

### 2. 환경변수 설정
```
GROQ_API_KEY=your_groq_api_key
NEWSAPI_KEY=your_newsapi_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. FastAPI 서버 실행
```bash
uvicorn api:app --reload
```

### 4. React 실행 (새 터미널)
```bash
cd frontend
npm install
npm start
```

### 5. 브라우저 접속
```
http://localhost:3000
```

---

## 📱 브리핑 예시

```
📊 오늘의 포트폴리오 브리핑

- AAPL: 현재가 $280.14, 등락률 +3.24%
- NVDA: 현재가 $198.45, 등락률 -0.56%
- 삼성전자 (005930): 현재가 232,500원, 등락률 +5.44%
- SK하이닉스 (000660): 현재가 1,447,000원, 등락률 +12.52%

📰 주요 뉴스
- AAPL: Apple announces record Q2 earnings driven by services growth
- NVDA: Nvidia expands AI chip partnership with major cloud providers
- 삼성전자: Samsung restructures home appliance business after profit erosion
- SK하이닉스: SK Hynix emerges as AI memory goldmine amid NVIDIA partnership

🔍 주목할 종목
SK하이닉스가 12.52% 급등하며 포트폴리오 수익률을 견인했습니다.

📈 총평
전반적으로 한국 주식 강세에 힘입어 포트폴리오가 긍정적인 흐름을 보였습니다.
```

---

## 🔧 트러블슈팅

### LangGraph deprecated 경고
```
LangGraphDeprecatedSinceV10: create_react_agent has been moved
```
→ 동작에는 문제없는 경고 메시지. LangGraph 1.0 이후 import 경로가 변경됐으나 하위 호환성 유지됨.

### 한국 주가 조회 실패 (out-of-bounds)
```
single positional indexer is out-of-bounds
```
→ 공휴일/주말로 거래 데이터가 1일치만 존재할 경우 발생. 조회 기간을 7일로 확장하여 해결.

### Gemini API 할당량 초과
```
429 RESOURCE_EXHAUSTED
```
→ 무료 tier 일일 한도 초과. Groq (LLaMA 3.3 70B) 로 LLM을 교체하여 해결. 속도도 더 빠름.

### MCP async with 컨텍스트 매니저 오류
```
NotImplementedError: MultiServerMCPClient cannot be used as a context manager
```
→ langchain-mcp-adapters 0.1.0부터 `async with` 방식 삭제. `await client.get_tools()` 방식으로 변경하여 해결.

### FastAPI 이벤트 루프 충돌
```
RuntimeError: asyncio.run() cannot be called from a running event loop
```
→ FastAPI가 이미 async 환경이라 `asyncio.run()` 중복 호출 시 충돌 발생. `await agent.ainvoke()` 방식으로 변경하여 해결.

### MCP Tool sync 호출 오류
```
NotImplementedError: StructuredTool does not support sync invocation
```
→ MCP Tool은 async 전용이라 `agent.invoke()` 대신 `await agent.ainvoke()`로 변경하여 해결.

---

## 🚀 향후 개선 계획

- [x] MCP 서버로 Tool 분리
- [ ] DART API 연동 (한국 공시 수집)
- [ ] 등락률 임계값 기반 즉시 알림 (±5% 이상)
- [ ] A2A 프로토콜 적용 (Agent 간 통신)
- [ ] 클라우드 배포 (AWS Lambda or GCP Cloud Run)