import {
  Video,
  Play,
  RotateCcw,
  Radio,
  Square,
  ClipboardList,
  Trophy,
} from "lucide-react";
import type { Status, LogEntry } from "../types";

interface DashboardProps {
  status: Status;
  carregando: string | null;
  logs: LogEntry[];
  conectado: boolean;
  iniciarBuffer: () => void;
  gerarReplay: () => void;
  iniciarLive: () => void;
  encerrarLive: () => void;
}

export default function Dashboard({
  status,
  carregando,
  logs,
  conectado,
  iniciarBuffer,
  gerarReplay,
  iniciarLive,
  encerrarLive,
}: DashboardProps) {
  const offline = !conectado;

  return (
    <div className="content">
      {status.ultimoReplay && (
        <div className="replay-banner" role="status" aria-live="polite">
          <div className="replay-banner-icon" aria-hidden="true">
            <Trophy size={28} strokeWidth={1.5} color="var(--laranja)" />
          </div>
          <div>
            <div className="replay-banner-label">
              Último replay publicado no YouTube
            </div>
            <div className="replay-banner-val">{status.ultimoReplay}</div>
          </div>
        </div>
      )}

      {offline && (
        <div className="offline-banner" role="alert">
          <strong>Servidor offline</strong> — verifique a conexão com o backend.
        </div>
      )}

      <div className="cards-grid">
        {/* Buffer */}
        <button
          className={`card-acao card-buffer ${status.bufferAtivo ? "ativo" : ""}`}
          onClick={iniciarBuffer}
          disabled={offline || !!carregando || status.bufferAtivo}
          aria-label={status.bufferAtivo ? "Captura já ativa" : "Iniciar captura de vídeo"}
        >
          <div className="card-header">
            <div className="card-icon" aria-hidden="true">
              {status.bufferAtivo ? (
                <Video size={28} strokeWidth={1.5} />
              ) : (
                <Play size={28} strokeWidth={1.5} />
              )}
            </div>
            {carregando === "buffer" && <div className="spinner" aria-hidden="true" />}
          </div>
          <div>
            <div className="card-title">
              {status.bufferAtivo ? "Captura Ativa" : "Iniciar Captura"}
            </div>
            <div className="card-sub">
              {status.bufferAtivo
                ? "Sistema gravando segmentos continuamente"
                : "Liga a câmera e prepara o buffer"}
            </div>
          </div>
        </button>

        {/* Replay */}
        <button
          className="card-acao card-replay"
          onClick={gerarReplay}
          disabled={offline || !!carregando || !status.bufferAtivo}
          aria-label="Gerar replay dos últimos 30 segundos"
        >
          <div className="card-header">
            <div className="card-icon" aria-hidden="true">
              <RotateCcw size={28} strokeWidth={1.5} />
            </div>
            {carregando === "replay" && (
              <div className="spinner spinner-dark" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="card-title">Gerar Replay</div>
            <div className="card-sub">Corta e publica os últimos 30 segundos</div>
          </div>
        </button>

        {/* Live */}
        <button
          className="card-acao card-live"
          onClick={iniciarLive}
          disabled={offline || !!carregando || status.liveAtiva || !status.bufferAtivo}
          aria-label="Iniciar transmissão ao vivo no YouTube"
        >
          <div className="card-header">
            <div className="card-icon" aria-hidden="true">
              <Radio size={28} strokeWidth={1.5} />
            </div>
            {carregando === "live" && <div className="spinner" aria-hidden="true" />}
          </div>
          <div>
            <div className="card-title">Iniciar Live</div>
            <div className="card-sub">Cria evento e transmite para o YouTube</div>
          </div>
        </button>

        {/* Stop */}
        <button
          className="card-acao card-stop"
          onClick={encerrarLive}
          disabled={offline || !status.liveAtiva || carregando === "stop"}
          aria-label="Encerrar transmissão ao vivo"
        >
          <div className="card-header">
            <div className="card-icon" aria-hidden="true">
              <Square size={28} strokeWidth={1.5} />
            </div>
            {carregando === "stop" && <div className="spinner" aria-hidden="true" />}
          </div>
          <div>
            <div className="card-title">Encerrar Live</div>
            <div className="card-sub">Finaliza a transmissão e retoma o buffer</div>
          </div>
        </button>
      </div>

      {/* Log */}
      <div className="log-wrap">
        <div className="log-head">
          <ClipboardList size={14} strokeWidth={2} aria-hidden="true" />
          <span>Histórico de Eventos</span>
        </div>
        <div className="log-scroll" role="log" aria-live="polite" aria-atomic="false">
          {logs.map((l) => (
            <div key={l.id} className={`log-row ${l.tipo}`}>
              <span className="log-time">{l.hora}</span>
              <span className="log-txt">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
