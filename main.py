from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from apscheduler.schedulers.blocking import BlockingScheduler
from tools.stock_tool import get_us_stock_info, get_kr_stock_info
from tools.news_tool import get_stock_news
from tools.telegram_tool import send_telegram_message
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 모니터링할 종목 리스트
PORTFOLIO = {
    "us": ["AAPL", "NVDA"],
    "kr": ["005930", "000660"]  # 삼성전자, SK하이닉스
}

# Groq 모델 설정
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

# Tool 목록
tools = [get_us_stock_info, get_kr_stock_info, get_stock_news]

# System 프롬프트
system_prompt = """당신은 주식 포트폴리오 모니터링 전문가입니다.
주어진 종목들의 주가 정보와 최신 뉴스를 조회하고 아래 형식으로 브리핑을 작성하세요.

📊 오늘의 포트폴리오 브리핑
- 각 종목의 현재가와 등락률 요약
- 모든 종목의 주요 뉴스 1줄 요약
- 주목할 종목 한 줄 코멘트
- 전체 포트폴리오 한 줄 총평
"""

# Agent 생성
agent = create_react_agent(
    model=llm,
    tools=tools,
    prompt=system_prompt
)

def run_briefing():
    """브리핑 생성 및 텔레그램 전송"""
    logger.info("포트폴리오 브리핑 시작...")
    try:
        portfolio_str = f"미국 종목: {PORTFOLIO['us']}, 한국 종목: {PORTFOLIO['kr']}"
        result = agent.invoke({
            "messages": [HumanMessage(content=f"""
다음 포트폴리오를 분석해줘: {portfolio_str}
모든 종목에 대해 뉴스를 검색해줘.
한국 종목은 영어 회사명으로 검색해줘. (삼성전자→Samsung Electronics, SK하이닉스→SK Hynix)
""")]
        })

        last_message = result['messages'][-1]
        if isinstance(last_message.content, list):
            for block in last_message.content:
                if isinstance(block, dict) and block.get('type') == 'text':
                    briefing = block['text']
        else:
            briefing = last_message.content

        print("\n" + "="*50)
        print(briefing)

        if send_telegram_message(briefing):
            logger.info("✅ 텔레그램 전송 완료!")
        else:
            logger.error("❌ 텔레그램 전송 실패")

    except Exception as e:
        logger.error(f"브리핑 실패: {str(e)}")

if __name__ == "__main__":
    # 즉시 한 번 실행
    run_briefing()

    # 매일 아침 9시에 자동 실행
    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    scheduler.add_job(run_briefing, 'cron', hour=9, minute=0)
    logger.info("스케줄러 시작 - 매일 오전 9시에 브리핑을 전송합니다.")
    scheduler.start()