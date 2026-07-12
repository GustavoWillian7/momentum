import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { config } from "./config";

const BUFFER_DIR = path.join(__dirname, "..", "temp", "buffer");
let ffmpegProcess: ChildProcess | null = null;

function limparBufferAntigo() {
  const arquivos = fs
    .readdirSync(BUFFER_DIR)
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => ({
      nome: f,
      tempo: fs.statSync(path.join(BUFFER_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => a.tempo - b.tempo);

  while (arquivos.length > config.maxSegments) {
    const mais_antigo = arquivos.shift()!;
    try {
      fs.unlinkSync(path.join(BUFFER_DIR, mais_antigo.nome));
    } catch (err) {
      // Silencioso
    }
  }
}

export function bufferAtivo(): boolean {
  return ffmpegProcess !== null && ffmpegProcess.killed === false;
}

export function iniciarBuffer() {
  if (bufferAtivo()) {
    console.log("⚠️ Buffer já está ativo. Ignorando duplo acionamento.");
    return;
  }

  console.log("🎥 Iniciando captura da câmera...");

  // Limpa segmentos antigos com segurança
  try {
    fs.readdirSync(BUFFER_DIR)
      .filter((f) => f.endsWith(".mp4"))
      .forEach((f) => {
        try {
          fs.unlinkSync(path.join(BUFFER_DIR, f));
        } catch (err) {}
      });
  } catch (err) {
    console.warn("⚠️ Não foi possível limpar buffer anterior:", err);
  }

  console.log("🧹 Buffer limpo.");

  const args = [
    "-y",

    // ─── TODO(camera): substituir pela URL RTSP da câmera Intelbras/DVR ───
    // Modelos comuns Intelbras (DVR/NVR):
    //   rtsp://admin:SENHA@IP:554/cam/realmonitor?channel=1&subtype=0
    //   subtype=0 = alta resolução (1080p)  |  subtype=1 = baixa resolução
    // Outras marcas:
    //   Hikvision: rtsp://admin:SENHA@IP:554/Streaming/Channels/101
    //   Dahua:     rtsp://admin:SENHA@IP:554/cam/realmonitor?channel=1&subtype=0
    "-rtsp_transport", "tcp",
    "-thread_queue_size", "512",
    "-i", "rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/cam/realmonitor?channel=1&subtype=0",

    // ─── TODO(camera): ajustar crop conforme resolução real da câmera ───
    // Webcam do notebook era 4:3. Câmera IP provavelmente é 1920x1080 (16:9).
    // Para Shorts 9:16, extraímos uma faixa vertical do centro da imagem.
    // Exemplo para 1920x1080: crop=607:1080:657:0,scale=360:640
    "-vf", "crop=480:480:80:0,scale=360:640",

    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "zerolatency",
    "-f", "segment",
    "-segment_time", String(config.segmentDuration),
    "-reset_timestamps", "1",
    path.join(BUFFER_DIR, "segment_%03d.mp4"),
  ];

  ffmpegProcess = spawn("ffmpeg", args);

  ffmpegProcess.stderr?.on("data", () => {
    limparBufferAntigo();
  });

  ffmpegProcess.on("close", (code) => {
    console.log(`⚠️ FFmpeg do Buffer encerrado com código ${code}`);
    ffmpegProcess = null;
  });

  console.log("✅ Buffer ativo. Segmentos sendo salvos em temp/buffer/");
}

export function encerrarBuffer() {
  if (!ffmpegProcess) return;

  const proc = ffmpegProcess;
  proc.kill("SIGTERM");
  console.log("🛑 Captura encerrada (SIGTERM). Aguardando processo...");

  // Espera até 3s por shutdown gracioso; senão, SIGKILL
  const timeout = setTimeout(() => {
    if (!proc.killed) {
      console.warn("⚠️ FFmpeg não respondeu a SIGTERM. Forçando SIGKILL...");
      proc.kill("SIGKILL");
    }
    if (ffmpegProcess === proc) {
      ffmpegProcess = null;
    }
  }, 3000);

  proc.on("close", () => {
    clearTimeout(timeout);
    if (ffmpegProcess === proc) {
      ffmpegProcess = null;
    }
  });
}
