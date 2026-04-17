import { useState, useEffect } from "react";
import axios from "axios";

type Status = {
  quadra: string;
  liveAtiva: boolean;
  ultimoReplay: string | null;
  bufferAtivo: boolean;
  liveUrl: string | null; // Tipagem atualizada para receber a URL
};

type LogEntry = {
  id: number;
  msg: string;
  tipo: "info" | "sucesso" | "erro";
  hora: string;
};

let logId = 0;

export default function App() {
  const [status, setStatus] = useState<Status>({
    quadra: "1",
    liveAtiva: false,
    ultimoReplay: null,
    bufferAtivo: false,
    liveUrl: null, // Valor inicial
  });
  const [quadraInput, setQuadraInput] = useState("1");
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebar, setSidebar] = useState(true);

  function addLog(msg: string, tipo: LogEntry["tipo"] = "info") {
    const agora = new Date();
    const hora = `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}:${agora.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [{ id: logId++, msg, tipo, hora }, ...prev].slice(0, 30));
  }

  useEffect(() => {
    addLog("Sistema inicializado", "info");
    const intervalo = setInterval(async () => {
      try {
        const { data } = await axios.get("/api/status");
        setStatus(data);
      } catch {}
    }, 2000);
    return () => clearInterval(intervalo);
  }, []);

  async function configurarQuadra() {
    if (quadraInput === status.quadra) return; 
    
    await axios.post("/api/config", { quadra: quadraInput });
    addLog(`Quadra ${quadraInput} configurada`, "sucesso");
    
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 1500);
  }

  async function iniciarBuffer() {
    setCarregando("buffer");
    await axios.post("/api/buffer/start");
    setCarregando(null);
    addLog("Captura de vídeo iniciada", "sucesso");
  }

  async function gerarReplay() {
    setCarregando("replay");
    addLog("Gerando replay...", "info");
    try {
      const { data } = await axios.post("/api/replay");
      addLog(`Replay enviado → ${data.url}`, "sucesso");
    } catch {
      addLog("Erro ao gerar replay", "erro");
    }
    setCarregando(null);
  }

  async function iniciarLive() {
    setCarregando("live");
    addLog("Iniciando transmissão ao vivo...", "info");
    try {
      await axios.post("/api/live/start");
      addLog("Live iniciada com sucesso", "sucesso");
    } catch {
      addLog("Erro ao iniciar live", "erro");
    }
    setCarregando(null);
  }

  async function encerrarLive() {
    setCarregando("stop");
    await axios.post("/api/live/stop");
    addLog("Live encerrada", "info");
    setCarregando(null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --areia:        #FDFCF0;
          --areia-meio:   #F5EED8;
          --areia-borda:  #E8DFC0;
          --sol:          #FFD700;
          --sol-hover:    #FFC200;
          --laranja:      #FF8C00;
          --navy:         #0D2340;
          --navy-meio:    #1A3A5C;
          --navy-claro:   #2A5080;
          --agua:         #0099BB;
          --verde:        #2E9E6B;
          --vermelho:     #E53935;
          --cinza-texto:  #5A6A7A;
          --cinza-borda:  rgba(13,35,64,0.10);
          --sombra-suave: 0 4px 24px rgba(13,35,64,0.07);
          --sombra-card:  0 2px 12px rgba(13,35,64,0.08);
          --raio:         16px;
          --raio-sm:      10px;
          --fonte-display:'Syne', sans-serif;
          --fonte-corpo:  'Familjen Grotesk', sans-serif;
        }

        html, body, #root {
          height: 100%;
          background: var(--areia);
          color: var(--navy);
          font-family: var(--fonte-corpo);
          font-size: 14px;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.4;
        }

        .layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* ─── SPINNER ANIMATION ─── */
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spinner {
          width: 20px; height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-dark {
          border: 3px solid rgba(13,35,64,0.2);
          border-top-color: var(--navy);
        }

        /* ─── SIDEBAR ─── */
        .sidebar {
          width: 270px;
          min-width: 270px;
          background: #fff;
          border-right: 1px solid var(--cinza-borda);
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(.4,0,.2,1), min-width 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s;
          overflow: hidden;
          box-shadow: 2px 0 20px rgba(13,35,64,0.04);
        }

        .sidebar.collapsed { width: 0; min-width: 0; opacity: 0; border-right: none; }

        .sidebar-logo {
          padding: 22px 20px 18px;
          border-bottom: 1px solid var(--cinza-borda);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-mark {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, var(--sol), var(--laranja));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(255,140,0,0.30);
          flex-shrink: 0;
        }

        .logo-name {
          font-family: var(--fonte-display);
          font-weight: 800;
          font-size: 17px;
          letter-spacing: 0.02em;
          color: var(--navy);
          white-space: nowrap;
        }

        .logo-tag {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--laranja);
          white-space: nowrap;
        }

        .sb-section { padding: 18px 20px 6px; }

        .sb-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cinza-texto);
          margin-bottom: 10px;
        }

        .quadra-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .quadra-input {
          width: 100%;
          background: var(--areia);
          border: 2px solid var(--areia-borda);
          border-radius: var(--raio-sm);
          padding: 10px 36px 10px 14px;
          font-family: var(--fonte-display);
          font-weight: 700;
          font-size: 16px;
          color: var(--navy);
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          appearance: none;
        }

        .quadra-input:focus {
          border-color: var(--sol);
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255,215,0,0.15);
        }

        .quadra-feedback {
          position: absolute;
          right: 12px;
          color: var(--verde);
          font-size: 16px;
          opacity: 0;
          transform: scale(0.5);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .quadra-feedback.show {
          opacity: 1;
          transform: scale(1);
        }

        .status-pills {
          padding: 4px 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pill {
          display: flex; align-items: center; justify-content: space-between;
          background: #fff;
          border: 1.5px solid var(--areia-borda);
          border-radius: var(--raio-sm);
          padding: 10px 14px;
          transition: background 0.2s;
        }

        .pill:hover { background: var(--areia); }

        .pill-label { font-size: 12px; color: var(--cinza-texto); font-weight: 600; }

        .pill-val {
          font-family: var(--fonte-display);
          font-weight: 800;
          font-size: 13px;
          color: var(--navy);
          display: flex; align-items: center; gap: 8px;
        }
        
        .quadra-numero {
          display: flex;
          align-items: center;
        }

        .hash-mark {
          font-size: 0.85em; 
          margin-right: 2px;
          transform: translateY(-1.5px); 
          opacity: 0.85; 
        }

        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .dot-green { background: var(--verde); box-shadow: 0 0 0 3px rgba(46,158,107,0.2); }
        .dot-gray  { background: var(--areia-borda); }
        .dot-red   {
          background: var(--vermelho);
          box-shadow: 0 0 0 4px rgba(229,57,53,0.2);
          animation: blink 1.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }

        .sb-footer {
          margin-top: auto;
          padding: 16px 20px;
          border-top: 1px solid var(--cinza-borda);
          font-size: 11px;
          color: var(--cinza-texto);
          text-align: center;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        /* ─── MAIN CONTENT ─── */
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #faf9f2; }

        .topbar {
          height: 64px;
          background: #fff;
          border-bottom: 1px solid var(--cinza-borda);
          display: flex; align-items: center;
          padding: 0 28px;
          gap: 14px;
          box-shadow: 0 2px 10px rgba(13,35,64,0.02);
          flex-shrink: 0;
        }

        .hamburger {
          width: 36px; height: 36px;
          background: var(--areia);
          border: 1px solid var(--areia-borda);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 15px;
          color: var(--navy-claro);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
        }

        .hamburger:hover { background: var(--areia-meio); transform: scale(1.05); }
        .hamburger:active { transform: scale(0.95); }

        .topbar-title {
          font-family: var(--fonte-display);
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 0.04em;
          color: var(--navy);
          text-transform: uppercase;
        }

        /* Transformando o chip em um link clicável e animado */
        .live-chip {
          margin-left: auto;
          display: flex; align-items: center; gap: 8px;
          background: rgba(229,57,53,0.08);
          border: 1.5px solid rgba(229,57,53,0.25);
          border-radius: 40px;
          padding: 6px 16px;
          font-family: var(--fonte-display);
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.1em;
          color: var(--vermelho);
          text-decoration: none;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .live-chip:hover {
          background: rgba(229,57,53,0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(229,57,53,0.2);
        }

        .live-chip-icon {
          font-size: 14px;
          font-weight: bold;
          margin-left: 2px;
          transition: transform 0.2s ease;
        }
        
        .live-chip:hover .live-chip-icon {
          transform: translate(2px, -2px);
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ─── REPLAY BANNER ─── */
        .replay-banner {
          background: linear-gradient(135deg, #fffcf0, #fff7d6);
          border: 2px solid rgba(255,215,0,0.4);
          border-radius: var(--raio);
          padding: 14px 20px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: 0 6px 20px rgba(255,215,0,0.12);
          animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .replay-banner-icon { font-size: 28px; flex-shrink: 0; filter: drop-shadow(0 4px 8px rgba(255,140,0,0.2)); }
        .replay-banner-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--laranja);
          margin-bottom: 2px;
        }
        .replay-banner-val {
          font-family: var(--fonte-display);
          font-size: 18px; font-weight: 800;
          color: var(--navy);
        }

        /* ─── CARDS ─── */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .card-acao {
          border: none;
          border-radius: var(--raio);
          padding: 18px 22px;
          cursor: pointer;
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 6px;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
          outline: none;
        }

        .card-acao::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .card-acao:hover::before { opacity: 1; }
        .card-acao:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(13,35,64,0.10); }
        .card-acao:active { transform: scale(0.97); }
        .card-acao:focus-visible { box-shadow: 0 0 0 4px var(--areia), 0 0 0 8px var(--navy-claro); }

        .card-acao:disabled { 
          opacity: 0.5; 
          cursor: not-allowed; 
          transform: none !important; 
          box-shadow: none !important; 
          animation: none !important; 
          filter: grayscale(40%);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 2px;
        }

        .card-icon { font-size: 28px; line-height: 1; }

        .card-title {
          font-family: var(--fonte-display);
          font-weight: 800; font-size: 17px;
          letter-spacing: 0.02em; text-transform: uppercase;
          color: #fff; line-height: 1;
        }

        .card-sub { font-size: 12px; color: rgba(255,255,255,0.75); font-weight: 500; line-height: 1.3; }

        .card-buffer {
          grid-column: span 2;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-claro) 100%);
          box-shadow: 0 8px 24px rgba(13,35,64,0.15);
        }

        .card-buffer.ativo {
          background: linear-gradient(135deg, #186844 0%, var(--verde) 100%);
          box-shadow: 0 8px 24px rgba(46,158,107,0.25);
        }

        .card-replay {
          background: linear-gradient(135deg, var(--laranja) 0%, var(--sol) 100%);
          box-shadow: 0 8px 24px rgba(255,140,0,0.25);
        }

        .card-replay:not(:disabled) {
          animation: pulse-replay 3s infinite alternate;
        }

        .card-replay .card-title { color: var(--navy); }
        .card-replay .card-sub   { color: rgba(13,35,64,0.65); }

        @keyframes pulse-replay {
          0% { box-shadow: 0 6px 20px rgba(255,140,0,0.20); }
          100% { box-shadow: 0 10px 28px rgba(255,140,0,0.35); }
        }

        .card-live {
          background: linear-gradient(135deg, #C62828 0%, var(--vermelho) 100%);
          box-shadow: 0 8px 24px rgba(229,57,53,0.25);
        }

        .card-stop {
          grid-column: span 2;
          background: linear-gradient(135deg, #263238, #455A64);
          box-shadow: 0 6px 16px rgba(13,35,64,0.15);
          border-left: 6px solid var(--vermelho);
        }

        /* ─── LOG ─── */
        .log-wrap {
          background: #fff;
          border: 1px solid var(--cinza-borda);
          border-radius: var(--raio);
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(13,35,64,0.03);
          flex-shrink: 0;
        }

        .log-head {
          padding: 12px 20px;
          background: var(--areia);
          border-bottom: 1px solid var(--cinza-borda);
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--navy-meio);
        }

        .log-scroll { max-height: 180px; overflow-y: auto; padding: 8px 0; }

        .log-row {
          display: flex; align-items: baseline; gap: 14px;
          padding: 6px 20px;
          border-left: 4px solid transparent;
          transition: background 0.15s;
        }

        .log-row:hover { background: #faf9f2; }
        .log-row.info    { border-color: var(--areia-borda); }
        .log-row.sucesso { border-color: var(--verde); background: rgba(46,158,107,0.03); }
        .log-row.erro    { border-color: var(--vermelho); background: rgba(229,57,53,0.03); }

        .log-time {
          font-family: var(--fonte-display);
          font-weight: 700;
          font-size: 11px; flex-shrink: 0;
          color: var(--cinza-texto);
          opacity: 0.6;
        }

        .log-txt { font-size: 13px; font-weight: 500; flex: 1; }
        .log-row.info    .log-txt { color: var(--navy-meio); }
        .log-row.sucesso .log-txt { color: #15663F; font-weight: 600; }
        .log-row.erro    .log-txt { color: #B71C1C; font-weight: 600; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--areia-borda); border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: #d0c5a3; }

        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: 1fr; }
          .card-buffer, .card-stop { grid-column: span 1; }
          .sidebar { position: absolute; height: 100%; z-index: 10; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
          .content { padding: 16px; }
        }
      `}</style>

      <div className="layout">
        <aside className={`sidebar ${!sidebar ? "collapsed" : ""}`}>
          <div className="sidebar-logo">
            <div className="logo-mark">🏖️</div>
            <div>
              <div className="logo-name">Momentum</div>
              <div className="logo-tag">Replay System</div>
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-label">Configuração de Quadra</div>
            <div className="quadra-input-wrapper">
              <input
                type="number" min="1"
                value={quadraInput}
                onChange={(e) => setQuadraInput(e.target.value)}
                onBlur={configurarQuadra} 
                onKeyDown={(e) => e.key === 'Enter' && configurarQuadra()}
                className="quadra-input"
                placeholder="Nº"
              />
              <span className={`quadra-feedback ${salvoFeedback ? 'show' : ''}`}>✔</span>
            </div>
          </div>

          <div className="sb-section">
            <div className="sb-label">Status do Sistema</div>
          </div>

          <div className="status-pills">
            <div className="pill">
              <span className="pill-label">Quadra ativa</span>
              <span className="pill-val" style={{ color: "var(--laranja)" }}>
                <span className="quadra-numero">
                  <span className="hash-mark">#</span>
                  {status.quadra}
                </span>
              </span>
            </div>
            <div className="pill">
              <span className="pill-label">Buffer</span>
              <span className="pill-val">
                <span className={`dot ${status.bufferAtivo ? "dot-green" : "dot-gray"}`} />
                {status.bufferAtivo ? "Gravando" : "Inativo"}
              </span>
            </div>
            <div className="pill">
              <span className="pill-label">Transmissão</span>
              <span className="pill-val">
                <span className={`dot ${status.liveAtiva ? "dot-red" : "dot-gray"}`} />
                {status.liveAtiva ? "Ao vivo" : "Offline"}
              </span>
            </div>
          </div>

          <div className="sb-footer">Momentum © 2026</div>
        </aside>

        <main className="main">
          <div className="topbar">
            <button className="hamburger" onClick={() => setSidebar(!sidebar)}>☰</button>
            <span className="topbar-title">Quadra {status.quadra} — Painel</span>
            
            {/* O chip de AO VIVO agora é um link que abre no YouTube! */}
            {status.liveAtiva && status.liveUrl && (
              <a href={status.liveUrl} target="_blank" rel="noopener noreferrer" className="live-chip">
                <span className="dot dot-red" />
                AO VIVO
                <span className="live-chip-icon">↗</span>
              </a>
            )}
          </div>

          <div className="content">
            {status.ultimoReplay && (
              <div className="replay-banner">
                <div className="replay-banner-icon">⚽</div>
                <div>
                  <div className="replay-banner-label">Último replay publicado no YouTube</div>
                  <div className="replay-banner-val">{status.ultimoReplay}</div>
                </div>
              </div>
            )}

            <div className="cards-grid">
              <button
                className={`card-acao card-buffer ${status.bufferAtivo ? "ativo" : ""}`}
                onClick={iniciarBuffer}
                disabled={!!carregando || status.bufferAtivo}
              >
                <div className="card-header">
                  <div className="card-icon">{status.bufferAtivo ? "🎥" : "▶"}</div>
                  {carregando === "buffer" && <div className="spinner" />}
                </div>
                <div>
                  <div className="card-title">
                    {status.bufferAtivo ? "Captura Ativa" : "Iniciar Captura"}
                  </div>
                  <div className="card-sub">
                    {status.bufferAtivo ? "Sistema gravando segmentos continuamente" : "Liga a câmera e prepara o buffer"}
                  </div>
                </div>
              </button>

              <button
                className="card-acao card-replay"
                onClick={gerarReplay}
                disabled={!!carregando || !status.bufferAtivo}
              >
                <div className="card-header">
                  <div className="card-icon">⚡</div>
                  {carregando === "replay" && <div className="spinner spinner-dark" />}
                </div>
                <div>
                  <div className="card-title">Gerar Replay</div>
                  <div className="card-sub">Corta e publica os últimos 30 segundos</div>
                </div>
              </button>

              <button
                className="card-acao card-live"
                onClick={iniciarLive}
                disabled={!!carregando || status.liveAtiva || !status.bufferAtivo}
              >
                <div className="card-header">
                  <div className="card-icon">🔴</div>
                  {carregando === "live" && <div className="spinner" />}
                </div>
                <div>
                  <div className="card-title">Iniciar Live</div>
                  <div className="card-sub">Cria evento e transmite para o YouTube</div>
                </div>
              </button>

              <button
                className="card-acao card-stop"
                onClick={encerrarLive}
                disabled={!status.liveAtiva || carregando === "stop"}
              >
                <div className="card-header">
                  <div className="card-icon">⏹</div>
                  {carregando === "stop" && <div className="spinner" />}
                </div>
                <div>
                  <div className="card-title">Encerrar Live</div>
                  <div className="card-sub">Finaliza a transmissão e retoma o buffer</div>
                </div>
              </button>
            </div>

            <div className="log-wrap">
              <div className="log-head">
                <span>📋</span> Histórico de Eventos
              </div>
              <div className="log-scroll">
                {logs.map((l) => (
                  <div key={l.id} className={`log-row ${l.tipo}`}>
                    <span className="log-time">{l.hora}</span>
                    <span className="log-txt">{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}