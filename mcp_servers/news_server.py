from mcp.server.fastmcp import FastMCP
import requests
import os
from dotenv import load_dotenv

load_dotenv()

mcp = FastMCP("news-server")

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")

@mcp.tool()
def get_stock_news(company_name: str) -> str:
    """회사명을 입력받아 NewsAPI에서 최신 영어 뉴스 3개를 반환합니다."""
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": company_name,
            "sortBy": "publishedAt",
            "pageSize": 10,
            "apiKey": NEWSAPI_KEY
        }
        response = requests.get(url, params=params)
        data = response.json()

        if data.get("status") != "ok" or not data.get("articles"):
            return f"{company_name} 관련 뉴스를 찾을 수 없습니다."

        english_articles = [
            a for a in data["articles"]
            if a.get("title") and all(ord(c) < 128 for c in a["title"][:20])
        ][:3]

        if not english_articles:
            return f"{company_name} 관련 영어 뉴스를 찾을 수 없습니다."

        result = f"[{company_name}] 최신 뉴스\n"
        for i, article in enumerate(english_articles, 1):
            result += f"{i}. {article['title']}\n"

        return result
    except Exception as e:
        return f"{company_name} 뉴스 조회 실패: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="stdio")