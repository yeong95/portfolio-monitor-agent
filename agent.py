from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage
from tools.stock_tool import get_us_stock_info, get_kr_stock_info
from tools.news_tool import get_stock_news

load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
tools = [get_us_stock_info, get_kr_stock_info, get_stock_news]

system_prompt = """당신은 주식 포트폴리오 모니터링 전문가입니다.
주어진 종목들의 주가 정보와 최신 뉴스를 조회하고 아래 형식으로 브리핑을 작성하세요.

📊 오늘의 포트폴리오 브리핑
- 각 종목의 현재가와 등락률 요약
- 모든 종목의 주요 뉴스 1줄 요약
- 주목할 종목 한 줄 코멘트
- 전체 포트폴리오 한 줄 총평
"""

agent = create_react_agent(
    model=llm,
    tools=tools,
    prompt=system_prompt
)

def run_agent(us_stocks: list, kr_stocks: list) -> str:
    """Agent 실행 후 브리핑 텍스트 반환"""
    portfolio_str = f"미국 종목: {us_stocks}, 한국 종목: {kr_stocks}"
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
                return block['text']
    return last_message.content