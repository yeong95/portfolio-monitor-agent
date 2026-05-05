import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000";

const POPULAR_US = ["AAPL", "NVDA", "TSLA", "MSFT", "GOOGL", "AMZN"];
const POPULAR_KR = [
  { ticker: "005930", name: "삼성전자" },
  { ticker: "000660", name: "SK하이닉스" },
  { ticker: "035420", name: "NAVER" },
  { ticker: "051910", name: "LG화학" },
  { ticker: "006400", name: "삼성SDI" },
];

// ───────── 공통 스타일 ─────────
const btn = (color = "#1976d2") => ({
  padding: "10px 20px",
  background: color,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: "bold",
  cursor: "pointer",
});

// ───────── 로그인 / 회원가입 화면 ─────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return setError("아이디와 비밀번호를 입력하세요.");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/auth/${mode}`, form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      onLogin(res.data.token, res.data.username);
    } catch (err) {
      setError(err.response?.data?.detail || "오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 360, boxShadow: "0 2px 16px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4, textAlign: "center" }}>📊 Portfolio Monitor</h1>
        <p style={{ color: "#888", fontSize: 13, textAlign: "center", marginBottom: 28 }}>
          {mode === "login" ? "로그인하여 시작하세요" : "새 계정을 만드세요"}
        </p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            placeholder="아이디"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, fontSize: 14 }}
          />
          {error && <p style={{ color: "#d32f2f", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btn(), marginTop: 4, padding: "12px" }}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "#666" }}>
          {mode === "login" ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: "#1976d2", cursor: "pointer", fontWeight: "bold" }}
          >
            {mode === "login" ? "회원가입" : "로그인"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ───────── 메인 앱 ─────────
export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState("");
  const [usStocks, setUsStocks] = useState([]);
  const [krStocks, setKrStocks] = useState([]);
  const [usInput, setUsInput] = useState("");
  const [krInput, setKrInput] = useState("");
  const [briefing, setBriefing] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendTelegram, setSendTelegram] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "unsaved"
  const saveTimer = useRef(null);
  const portfolioLoaded = useRef(false);

  // 앱 시작 시 localStorage에서 토큰 복원
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");
    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUsername(savedUsername);
    }
  }, []);

  // 로그인 후 포트폴리오 불러오기
  useEffect(() => {
    if (!token) return;
    portfolioLoaded.current = false;
    axios
      .get(`${API}/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUsStocks(res.data.us_stocks);
        setKrStocks(res.data.kr_stocks);
        portfolioLoaded.current = true;
        setSaveStatus("saved");
      })
      .catch(() => logout());
  }, [token]);

  // 포트폴리오 변경 시 1초 후 자동 저장
  const autoSave = useCallback(
    (us, kr) => {
      if (!token || !portfolioLoaded.current) return;
      setSaveStatus("unsaved");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await axios.put(
            `${API}/portfolio`,
            { us_stocks: us, kr_stocks: kr },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSaveStatus("saved");
        } catch {
          setSaveStatus("unsaved");
        }
      }, 1000);
    },
    [token]
  );

  const addUsStock = (ticker) => {
    const t = ticker.toUpperCase().trim();
    if (!t || usStocks.includes(t)) return setUsInput("");
    const next = [...usStocks, t];
    setUsStocks(next);
    autoSave(next, krStocks);
    setUsInput("");
  };

  const addKrStock = (ticker) => {
    if (!ticker || krStocks.includes(ticker)) return setKrInput("");
    const next = [...krStocks, ticker];
    setKrStocks(next);
    autoSave(usStocks, next);
    setKrInput("");
  };

  const removeUsStock = (ticker) => {
    const next = usStocks.filter((s) => s !== ticker);
    setUsStocks(next);
    autoSave(next, krStocks);
  };

  const removeKrStock = (ticker) => {
    const next = krStocks.filter((s) => s !== ticker);
    setKrStocks(next);
    autoSave(usStocks, next);
  };

  const runBriefing = async () => {
    setLoading(true);
    setBriefing("");
    try {
      const res = await axios.post(
        `${API}/briefing`,
        { us_stocks: usStocks, kr_stocks: krStocks, send_telegram: sendTelegram },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBriefing(res.data.briefing);
    } catch {
      setBriefing("오류가 발생했습니다. 서버를 확인해주세요.");
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername("");
    setUsStocks([]);
    setKrStocks([]);
    setBriefing("");
    portfolioLoaded.current = false;
  };

  const onLogin = (t, u) => {
    setToken(t);
    setUsername(u);
  };

  if (!token) return <AuthScreen onLogin={onLogin} />;

  const saveLabel = { saved: "✓ 저장됨", saving: "저장 중...", unsaved: "● 저장 대기" };
  const saveColor = { saved: "#4caf50", saving: "#ff9800", unsaved: "#999" };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>📊 Portfolio Monitor</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: saveColor[saveStatus] }}>{saveLabel[saveStatus]}</span>
          <span style={{ fontSize: 13, color: "#666" }}>👤 {username}</span>
          <button onClick={logout} style={{ ...btn("#e53935"), padding: "6px 14px", fontSize: 13 }}>로그아웃</button>
        </div>
      </div>
      <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>종목을 선택하고 브리핑을 실행하세요.</p>

      {/* 미국 종목 */}
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
          <button onClick={() => addUsStock(usInput)} style={btn()}>추가</button>
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

      {/* 한국 종목 */}
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
          <button onClick={() => addKrStock(krInput)} style={btn()}>추가</button>
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
