from mcp.server.fastmcp import FastMCP
import yfinance as yf
from pykrx import stock
from datetime import datetime, timedelta

mcp = FastMCP("stock-server")

@mcp.tool()
def get_us_stock_info(ticker: str) -> str:
    """미국 주식 티커를 입력받아 현재가, 등락률, 거래량을 반환합니다."""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="2d")

        if hist.empty:
            return f"{ticker} 데이터를 찾을 수 없습니다."

        prev_close = hist['Close'].iloc[-2]
        curr_close = hist['Close'].iloc[-1]
        change_pct = ((curr_close - prev_close) / prev_close) * 100
        volume = hist['Volume'].iloc[-1]

        return f"""
[미국] {ticker}
현재가: ${curr_close:.2f}
등락률: {change_pct:+.2f}%
거래량: {volume:,}
"""
    except Exception as e:
        return f"{ticker} 조회 실패: {str(e)}"

@mcp.tool()
def get_kr_stock_info(ticker: str) -> str:
    """한국 주식 티커(6자리)를 입력받아 현재가, 등락률, 거래량을 반환합니다."""
    try:
        today = datetime.now().strftime("%Y%m%d")
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y%m%d")

        df = stock.get_market_ohlcv_by_date(week_ago, today, ticker)

        if df.empty or len(df) < 2:
            return f"{ticker} 데이터를 찾을 수 없습니다."

        prev_close = df['종가'].iloc[-2]
        curr_close = df['종가'].iloc[-1]
        change_pct = ((curr_close - prev_close) / prev_close) * 100
        volume = df['거래량'].iloc[-1]
        name = stock.get_market_ticker_name(ticker)

        return f"""
[한국] {name} ({ticker})
현재가: {curr_close:,}원
등락률: {change_pct:+.2f}%
거래량: {volume:,}
"""
    except Exception as e:
        return f"{ticker} 조회 실패: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="stdio")