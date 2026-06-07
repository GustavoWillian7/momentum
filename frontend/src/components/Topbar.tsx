import { Menu, Radio, ExternalLink, WifiOff } from "lucide-react";
import type { Status } from "../types";

interface TopbarProps {
  sidebar: boolean;
  setSidebar: (v: boolean) => void;
  status: Status;
  conectado: boolean;
}

export default function Topbar({ sidebar, setSidebar, status, conectado }: TopbarProps) {
  return (
    <div className="topbar">
      <button
        className="hamburger"
        onClick={() => setSidebar(!sidebar)}
        aria-label={sidebar ? "Fechar menu" : "Abrir menu"}
        aria-expanded={sidebar}
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <span className="topbar-title">Quadra {status.quadra} — Painel</span>

      {!conectado && (
        <span
          className="offline-chip"
          role="status"
          aria-label="Servidor offline"
          title="Servidor offline"
        >
          <WifiOff size={14} strokeWidth={2} aria-hidden="true" />
          <span>OFFLINE</span>
        </span>
      )}

      {status.liveAtiva && status.liveUrl && (
        <a
          href={status.liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="live-chip"
          aria-label="Assistir transmissão ao vivo no YouTube (abre em nova aba)"
        >
          <Radio size={14} strokeWidth={2.5} className="dot-red" aria-hidden="true" />
          <span>AO VIVO</span>
          <span className="live-chip-icon" aria-hidden="true">
            <ExternalLink size={14} strokeWidth={2} />
          </span>
        </a>
      )}
    </div>
  );
}
