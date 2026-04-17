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

export function iniciarBuffer() {
  if (ffmpegProcess) {
    encerrarBuffer();
  }

  console.log("🎥 Iniciando captura da webcam...");

  // Limpa segmentos antigos
  fs.readdirSync(BUFFER_DIR)
    .filter((f) => f.endsWith(".mp4"))
    .forEach((f) => {
      try {
        fs.unlinkSync(path.join(BUFFER_DIR, f));
      } catch (err) {}
    });

  console.log("🧹 Buffer limpo.");

  const args = [
    "-y",
    "-f", "vfwcap",
    "-i", "0",
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
    console.log(`⚠️  FFmpeg do Buffer encerrado com código ${code}`);
  });

  console.log("✅ Buffer ativo. Segmentos sendo salvos em temp/buffer/");
}

export function encerrarBuffer() {
  ffmpegProcess?.kill("SIGTERM");
  console.log("🛑 Captura encerrada.");
}