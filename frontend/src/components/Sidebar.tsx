import { Trophy, Check, Upload } from "lucide-react";
import type { Status } from "../types";

interface SidebarProps {
  sidebar: boolean;
  quadraInput: string;
  setQuadraInput: (v: string) => void;
  status: Status;
  configurarQuadra: () => void;
  salvoFeedback: boolean;
}

export default function Sidebar({
  sidebar,
  quadraInput,
  setQuadraInput,
  status,
  configurarQuadra,
  salvoFeedback,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${!sidebar ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="logo-mark" aria-hidden="true">
          <Trophy size={20} strokeWidth={2} color="#fff" />
        </div>
        <div>
          <div className="logo-name">Momentum</div>
          <div className="logo-tag">Replay System</div>
        </div>
      </div>

      <div className="sb-section">
        <label htmlFor="quadra-input" className="sb-label">Configuração de Quadra</label>
        <div className="quadra-input-wrapper">
          <input
            id="quadra-input"
            type="number"
            min={1}
            value={quadraInput}
            onChange={(e) => setQuadraInput(e.target.value)}
            onBlur={configurarQuadra}
            onKeyDown={(e) => e.key === "Enter" && configurarQuadra()}
            className="quadra-input"
            placeholder="Nº"
            aria-label="Número da quadra"
          />
          <span className={`quadra-feedback ${salvoFeedback ? "show" : ""}`} aria-hidden="true">
            <Check size={16} strokeWidth={3} color="var(--verde)" />
          </span>
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
            <span className={`dot ${status.bufferAtivo ? "dot-green" : "dot-gray"}`} aria-hidden="true" />
            {status.bufferAtivo ? "Gravando" : "Inativo"}
          </span>
        </div>
        <div className="pill">
          <span className="pill-label">Transmissão</span>
          <span className="pill-val">
            <span className={`dot ${status.liveAtiva ? "dot-red" : "dot-gray"}`} aria-hidden="true" />
            {status.liveAtiva ? "Ao vivo" : "Offline"}
          </span>
        </div>
        {status.uploadEmAndamento && (
          <div className="pill">
            <span className="pill-label">Upload</span>
            <span className="pill-val">
              <Upload size={14} strokeWidth={2} color="var(--laranja)" />
              Enviando...
            </span>
          </div>
        )}
      </div>

      <div className="sb-footer">Momentum © 2026</div>
    </aside>
  );
}
