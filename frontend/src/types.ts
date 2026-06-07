export type Status = {
  quadra: string;
  liveAtiva: boolean;
  ultimoReplay: string | null;
  bufferAtivo: boolean;
  liveUrl: string | null;
  uploadEmAndamento: boolean;
};

export type LogEntry = {
  id: number;
  msg: string;
  tipo: "info" | "sucesso" | "erro";
  hora: string;
};
