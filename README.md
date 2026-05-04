# 📊 Portfolio Monitor Agent

LangChain Agent 기반 주식 포트폴리오 자동 모니터링 시스템.
한국/미국 종목의 주가와 뉴스를 매일 아침 텔레그램으로 브리핑합니다.

---

## 🏗️ 아키텍처

```
포트폴리오 입력 (한국 + 미국 종목)
        ↓
LangChain Agent (Groq - LLaMA 3.3 70B)
        ↓
┌─────────────────────────────────────┐
│              Tools                   │
│  - get_us_stock_info (yfinance)      │
│  - get_kr_stock_info (pykrx)         │
│  - get_stock_news    (NewsAPI)       │
└─────────────────────────────────────┘
        ↓
브리핑 생성 (LLM 분석 및 요약)
        ↓
텔레그램 Bot 전송
```

---

## 🛠️ 기술 스택

| 분류 | 기술 | 선택 이유 |
|---|---|---|
| AI Framework | LangChain + LangGraph | Tool calling 기반 Agent 구현 |
| LLM | Groq (LLaMA 3.3 70B) | 무료 tier, 빠른 응답속도 |
| 주가 (미국) | yfinance | 무료 Yahoo Finance API |
| 주가 (한국) | pykrx | KRX 공식 데이터 |
| 뉴스 | NewsAPI | 글로벌 뉴스 수집 |
| 알림 | Telegram Bot API | 모바일 실시간 알림 |
| 스케줄링 | APScheduler | 경량 Python 스케줄러 |

---

## 📁 프로젝트 구조

```
portfolio-monitor/
├── main.py               # Agent 실행 및 스케줄러
├── .env                  # API 키 관리
└── tools/
    ├── stock_tool.py     # 주가 수집 Tool (한국/미국)
    ├── news_tool.py      # 뉴스 수집 Tool
    └── telegram_tool.py  # 텔레그램 전송
```

---

## ⚙️ 설치 및 실행

### 1. 패키지 설치
```bash
python -m venv venv
source venv/bin/activate
pip install langchain langchain-groq langgraph langchain-google-genai
pip install yfinance pykrx newsapi-python
pip install python-telegram-bot apscheduler python-dotenv
pip install beautifulsoup4 requests
```

### 2. 환경변수 설정
```
GROQ_API_KEY=your_groq_api_key
NEWSAPI_KEY=your_newsapi_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. 종목 설정
`main.py`에서 모니터링할 종목을 설정합니다.
```python
PORTFOLIO = {
    "us": ["AAPL", "NVDA"],        # 미국 종목
    "kr": ["005930", "000660"]     # 한국 종목 (삼성전자, SK하이닉스)
}
```

### 4. 실행
```bash
python main.py
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

### 네이버 금융 뉴스 크롤링 실패
→ 네이버 금융이 JavaScript 렌더링 기반으로 변경되어 직접 크롤링 불가. NewsAPI로 대체.

---

## 🚀 향후 개선 계획

- [ ] MCP 서버로 Tool 분리 (A2A 프로토콜 적용)
- [ ] DART API 연동 (한국 공시 수집)
- [ ] 등락률 임계값 기반 즉시 알림 (±5% 이상)
- [ ] 종목 동적 추가/삭제 CLI
- [ ] 클라우드 배포 (AWS Lambda or GCP Cloud Run)
```
