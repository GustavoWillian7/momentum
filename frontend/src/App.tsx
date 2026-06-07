import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import type { Status, LogEntry } from "./types";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";

let logId = 0;
const MAX_POLLING_ERRORS = 3;

export default function App() {
  const [status, setStatus] = useState<Status>({
    quadra: "1",
    liveAtiva: false,
    ultimoReplay: null,
    bufferAtivo: false,
    liveUrl: null,
    uploadEmAndamento: false,
  });
  const [quadraInput, setQuadraInput] = useState("1");
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [carregando, setCarregando] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebar, setSidebar] = useState(true);
  const [conectado, setConectado] = useState(true);
  const erroRef = useRef(0);

  function addLog(msg: string, tipo: LogEntry["tipo"] = "info") {
    const agora = new Date();
    const hora = `${agora.getHours().toString().padStart(2, "0")}:${agora.getMinutes().toString().padStart(2, "0")}:${agora.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [{ id: logId++, msg, tipo, hora }, ...prev].slice(0, 30));
  }

  useEffect(() => {
    addLog("Sistema inicializado", "info");
    const intervalo = setInterval(async () => {
      try {
        const { data } = await axios.get("/api/status", { timeout: 5000 });
        setStatus(data);
        if (!conectado) {
          setConectado(true);
          erroRef.current = 0;
          addLog("Conexão com o servidor restabelecida", "sucesso");
        }
      } catch {
        erroRef.current += 1;
        if (erroRef.current >= MAX_POLLING_ERRORS && conectado) {
          setConectado(false);
          addLog("Servidor offline ou indisponível", "erro");
        }
      }
    }, 2000);
    return () => clearInterval(intervalo);
  }, [conectado]);

  async function configurarQuadra() {
    if (quadraInput === status.quadra) return;
    try {
      await axios.post("/api/config", { quadra: quadraInput });
      addLog(`Quadra ${quadraInput} configurada`, "sucesso");
      setSalvoFeedback(true);
      setTimeout(() => setSalvoFeedback(false), 1500);
    } catch {
      addLog("Erro ao configurar quadra", "erro");
    }
  }

  async function iniciarBuffer() {
    if (!conectado) {
      addLog("Servidor offline — impossível iniciar captura", "erro");
      return;
    }
    setCarregando("buffer");
    try {
      await axios.post("/api/buffer/start");
      addLog("Captura de vídeo iniciada", "sucesso");
    } catch (err: any) {
      const msg = err.response?.data?.erro || "Erro ao iniciar captura";
      addLog(msg, "erro");
    }
    setCarregando(null);
  }

  async function gerarReplay() {
    if (!conectado) {
      addLog("Servidor offline — impossível gerar replay", "erro");
      return;
    }
    setCarregando("replay");
    addLog("Gerando replay...", "info");
    try {
      const { data } = await axios.post("/api/replay");
      if (data.ok) {
        addLog(data.msg || "Replay gerado. Upload iniciado...", "sucesso");
      }
    } catch (err: any) {
      const msg = err.response?.data?.erro || "Erro ao gerar replay";
      addLog(msg, "erro");
    }
    setCarregando(null);
  }

  async function iniciarLive() {
    if (!conectado) {
      addLog("Servidor offline — impossível iniciar live", "erro");
      return;
    }
    setCarregando("live");
    addLog("Iniciando transmissão ao vivo...", "info");
    try {
      await axios.post("/api/live/start");
      addLog("Live iniciada com sucesso", "sucesso");
    } catch (err: any) {
      const msg = err.response?.data?.erro || "Erro ao iniciar live";
      addLog(msg, "erro");
    }
    setCarregando(null);
  }

  async function encerrarLive() {
    if (!conectado) {
      addLog("Servidor offline — impossível encerrar live", "erro");
      return;
    }
    setCarregando("stop");
    try {
      await axios.post("/api/live/stop");
      addLog("Live encerrada", "info");
    } catch (err: any) {
      const msg = err.response?.data?.erro || "Erro ao encerrar live";
      addLog(msg, "erro");
    }
    setCarregando(null);
  }

  return (
    <div className="layout">
      <Sidebar
        sidebar={sidebar}
        quadraInput={quadraInput}
        setQuadraInput={setQuadraInput}
        status={status}
        configurarQuadra={configurarQuadra}
        salvoFeedback={salvoFeedback}
      />

      <div className="main">
        <Topbar
          sidebar={sidebar}
          setSidebar={setSidebar}
          status={status}
          conectado={conectado}
        />

        <Dashboard
          status={status}
          carregando={carregando}
          logs={logs}
          conectado={conectado}
          iniciarBuffer={iniciarBuffer}
          gerarReplay={gerarReplay}
          iniciarLive={iniciarLive}
          encerrarLive={encerrarLive}
        />
      </div>
    </div>
  );
}
