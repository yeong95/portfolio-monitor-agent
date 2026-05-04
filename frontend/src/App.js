import { useState } from "react";
import axios from "axios";

const POPULAR_US = ["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN"];
const POPULAR_KR = [
  { ticker: "005930", name: "삼성전자" },
  { ticker: "000660", name: "SK하이닉스" },
  { ticker: "035420", name: "NAVER" },
  { ticker: "051910", name: "LG화학" },
  { ticker: "006400", name: "삼성SDI" },
];

export default function App() {
  const [usStocks, setUsStocks] = useState(["AAPL", "NVDA"]);
  const [krStocks, setKrStocks] = useState(["005930", "000660"]);
  const [usInput, setUsInput] = useState("");
  const [krInput, setKrInput] = useState("");
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);

  const addUsStock = (ticker) => {
    const t = ticker.toUpperCase().trim();
    if (t && !usStocks.includes(t)) setUsStocks([...usStocks, t]);
    setUsInput("");
  };

  const addKrStock = (ticker) => {
    if (ticker && !krStocks.includes(ticker)) setKrStocks([...krStocks, ticker]);
    setKrInput("");
  };

  const removeUsStock = (ticker) => setUsStocks(usStocks.filter((s) => s !== ticker));
  const removeKrStock = (ticker) => setKrStocks(krStocks.filter((s) => s !== ticker));

  const runBriefing = async () => {
    setLoading(true);
    setBriefing("");
    try {
      const res = await axios.post("http://localhost:8000/briefing", {
        us_stocks: usStocks,
        kr_stocks: krStocks,
        send_telegram: sendTelegram,
      });
      setBriefing(res.data.briefing);
    } catch (e) {
      setBriefing("오류가 발생했습니다. 서버를 확인해주세요.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>📊 Portfolio Monitor</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>종목을 선택하고 브리핑을 실행하세요.</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>🇺🇸 미국 종목</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {POPULAR_US.map((t) => (
            <button key={t} onClick={() => addUsStock(t)} disabled={usStocks.includes(t)}
              style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #ddd",
                background: usStocks.includes(t) ? "#e8f4e8" : "#fff",
                color: usStocks.includes(t) ? "#2e7d32" : "#333",
                cursor: usStocks.includes(t) ? "default" : "pointer", fontSize: 13 }}>
              {t} {usStocks.includes(t) ? "✓" : "+"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={usInput} onChange={(e) => setUsInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUsStock(usInput)}
            placeholder="직접 입력 (예: META)"
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }} />
          <button onClick={() => addUsStock(usInput)}
            style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            추가
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {usStocks.map((t) => (
            <span key={t} style={{ padding: "6px 12px", background: "#e3f2fd", borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              {t}
              <span onClick={() => removeUsStock(t)} style={{ cursor: "pointer", color: "#999", fontWeight: "bold" }}>×</span>
            </span>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>🇰🇷 한국 종목</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {POPULAR_KR.map((s) => (
            <button key={s.ticker} onClick={() => addKrStock(s.ticker)} disabled={krStocks.includes(s.ticker)}
              style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid #ddd",
                background: krStocks.includes(s.ticker) ? "#e8f4e8" : "#fff",
                color: krStocks.includes(s.ticker) ? "#2e7d32" : "#333",
                cursor: krStocks.includes(s.ticker) ? "default" : "pointer", fontSize: 13 }}>
              {s.name} {krStocks.includes(s.ticker) ? "✓" : "+"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={krInput} onChange={(e) => setKrInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKrStock(krInput)}
            placeholder="직접 입력 (예: 035720)"
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }} />
          <button onClick={() => addKrStock(krInput)}
            style={{ padding: "8px 16px", background: "#1976d2", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
            추가
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {krStocks.map((t) => (
            <span key={t} style={{ padding: "6px 12px", background: "#e8f4e8", borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              {POPULAR_KR.find((s) => s.ticker === t)?.name || t}
              <span onClick={() => removeKrStock(t)} style={{ cursor: "pointer", color: "#999", fontWeight: "bold" }}>×</span>
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <input type="checkbox" id="telegram" checked={sendTelegram} onChange={(e) => setSendTelegram(e.target.checked)} />
        <label htmlFor="telegram" style={{ fontSize: 14, color: "#444" }}>텔레그램으로도 전송</label>
      </div>

      <button onClick={runBriefing} disabled={loading || (usStocks.length === 0 && krStocks.length === 0)}
        style={{ width: "100%", padding: "14px", background: loading ? "#ccc" : "#1976d2",
          color: "#fff", border: "none", borderRadius: 10, fontSize: 16,
          fontWeight: "bold", cursor: loading ? "default" : "pointer", marginBottom: 24 }}>
        {loading ? "⏳ 브리핑 생성 중..." : "🚀 브리핑 실행"}
      </button>

      {briefing && (
        <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 10, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>📋 브리핑 결과</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#333" }}>{briefing}</pre>
        </div>
      )}
    </div>
  );
}
