import * as readline from "readline";
import express from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { iniciarBuffer, encerrarBuffer, bufferAtivo } from "./buffer";
import { gerarReplay } from "./replay";
import { spawn, ChildProcess } from "child_process";
import { uploadReplay, iniciarLiveYouTube, encerrarLiveYouTube, transicionarParaLive } from "./youtube";
import { config } from "./config";

const app = express();
app.use(cors());
app.use(express.json());

let quadraAtual = "1";
let ultimoReplay: string | null = null;
let liveProcess: ChildProcess | null = null;
let broadcastIdAtual: string | null = null;

// Flags de operação mutuamente exclusivas (live sempre ganha)
let liveAtiva = false;
let uploadEmAndamento = false;

// ─── STATUS ───

app.get("/api/status", (_, res) => {
  res.json({
    quadra: quadraAtual,
    liveAtiva,
    bufferAtivo: bufferAtivo(),
    ultimoReplay,
    liveUrl: broadcastIdAtual ? `https://youtube.com/watch?v=${broadcastIdAtual}` : null,
    uploadEmAndamento,
  });
});

// ─── CONFIGURAÇÃO ───

app.post("/api/config", (req, res) => {
  quadraAtual = req.body.quadra || "1";
  res.json({ ok: true });
});

// ─── BUFFER ───

app.post("/api/buffer/start", (req, res) => {
  if (liveAtiva) {
    res.status(409).json({ erro: "Não é possível iniciar buffer durante uma live. Encerre a live primeiro." });
    return;
  }
  if (bufferAtivo()) {
    res.json({ ok: true, msg: "Buffer já estava ativo" });
    return;
  }
  iniciarBuffer();
  res.json({ ok: true });
});

// ─── REPLAY (fire-and-forget) ───

app.post("/api/replay", async (req, res) => {
  if (uploadEmAndamento) {
    res.status(429).json({ erro: "Upload anterior ainda em andamento. Aguarde." });
    return;
  }
  if (!bufferAtivo()) {
    res.status(400).json({ erro: "Buffer não está ativo. Inicie a captura primeiro." });
    return;
  }

  const videoPath = gerarReplay(quadraAtual);
  if (!videoPath) {
    res.status(400).json({ erro: "Buffer insuficiente. Aguarde pelo menos 10 segundos." });
    return;
  }

  // Responde imediatamente; upload acontece em background
  uploadEmAndamento = true;
  res.json({ ok: true, msg: "Replay gerado. Upload em andamento..." });

  // Background job
  (async () => {
    try {
      const videoId = await uploadReplay(videoPath, quadraAtual);
      ultimoReplay = new Date().toLocaleTimeString("pt-BR");
      if (videoId) {
        console.log(`✅ Replay disponível: https://youtube.com/watch?v=${videoId}`);
      }
    } catch (err: any) {
      console.error("❌ Upload falhou em background:", err.message);
    } finally {
      uploadEmAndamento = false;
    }
  })();
});

// ─── LIVE START ───

app.post("/api/live/start", async (_, res) => {
  if (liveAtiva) {
    res.status(409).json({ erro: "Live já está ativa." });
    return;
  }
  if (uploadEmAndamento) {
    res.status(429).json({ erro: "Aguarde o upload do replay atual terminar." });
    return;
  }

  try {
    // 1. Pausa o buffer e libera a câmera
    encerrarBuffer();
    console.log("⏸ Buffer pausado para liberar câmera para a live");

    await new Promise((r) => setTimeout(r, 4000));

    // Garante que buffer realmente morreu
    if (bufferAtivo()) {
      console.warn("⚠️ Buffer ainda ativo após encerrarBuffer(). Abortando live.");
      res.status(503).json({ erro: "Câmera não liberada. Tente novamente em alguns segundos." });
      return;
    }

    // 2. Cria o evento da transmissão no YouTube
    console.log("⚙️ Solicitando criação da live na API do YouTube...");
    const liveData = await iniciarLiveYouTube(quadraAtual);

    if (!liveData) {
      throw new Error("Falha ao criar o broadcast no YouTube.");
    }

    broadcastIdAtual = liveData.broadcastId;

    // 3. Inicia o FFmpeg via Node
    console.log(`🗂 Iniciando transmissão para RTMP gerado dinamicamente...`);

    const args = [
      "-y",

      // ─── 1. Captura de Vídeo via RTSP ───
      // TODO(camera): usar a mesma URL RTSP do buffer.ts
      // Mantenha -re para ler os frames no framerate da câmera (evita quebras na live)
      "-rtsp_transport", "tcp",
      "-re",
      "-thread_queue_size", "512",
      "-i", "rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/cam/realmonitor?channel=1&subtype=0",

      // ─── 2. Áudio ───
      // TODO(camera): se a câmera transmitir áudio pelo RTSP, remova o anullsrc
      // e use o áudio do próprio stream (-c:a aac já captura da fonte).
      // Por enquanto mantemos áudio sintético silencioso para o YouTube aceitar.
      "-f", "lavfi",
      "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",

      // ─── 3. Filtros de Vídeo ───
      // TODO(camera): ajustar crop conforme resolução real da câmera
      // Webcam antiga era 4:3. Câmera IP provavelmente é 1920x1080 (16:9).
      // Exemplo para 1920x1080 em live 4:3: crop=1440:1080:240:0,scale=640:480,fps=30
      "-vf", "crop=480:480:80:0,scale=640:480,fps=30",

      // 4. Encode de Vídeo
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-tune", "zerolatency",
      "-b:v", "2500k",
      "-maxrate", "2500k",
      "-bufsize", "5000k",
      "-g", "60",

      // 5. Encode de Áudio
      "-c:a", "aac",
      "-b:a", "128k",

      // 6. Saída
      "-f", "flv",
      liveData.rtmp,
    ];

    liveProcess = spawn("ffmpeg", args);

    liveProcess.stderr?.on("data", (data) => {
      process.stdout.write(`[FFmpeg Live] ${data.toString()}`);
    });

    liveProcess.on("close", (code) => {
      console.log(`⚠️ FFmpeg Live encerrado com código ${code}`);
      liveProcess = null;
      if (liveAtiva) {
        // FFmpeg morreu sozinho — marca live como encerrada
        liveAtiva = false;
        broadcastIdAtual = null;
        console.log("🔴 Live encerrada inesperadamente. Retomando buffer...");
        iniciarBuffer();
      }
    });

    liveAtiva = true;
    console.log(`🔴 Live iniciada localmente. O YouTube assumirá assim que receber o vídeo!`);
    res.json({ ok: true, url: `https://youtube.com/watch?v=${broadcastIdAtual}` });

  } catch (err: any) {
    console.error("❌ Erro no processo de live:", err.message);
    liveAtiva = false;
    broadcastIdAtual = null;
    liveProcess = null;
    // Tenta retomar buffer se possível
    if (!bufferAtivo()) {
      iniciarBuffer();
    }
    res.status(500).json({ erro: err.message });
  }
});

// ─── LIVE STOP ───

app.post("/api/live/stop", async (_, res) => {
  if (!liveAtiva) {
    res.status(400).json({ erro: "Nenhuma live ativa." });
    return;
  }

  try {
    // 1. Avisa o YouTube que a transmissão acabou
    if (broadcastIdAtual) {
      console.log("⚙️ Encerrando evento na API do YouTube...");
      await encerrarLiveYouTube(broadcastIdAtual).catch((err) => {
        console.warn("⚠️ Falha ao notificar YouTube, mas continuando:", err.message);
      });
      broadcastIdAtual = null;
    }

    // 2. Mata o processo filho
    if (liveProcess) {
      const proc = liveProcess;
      proc.kill("SIGTERM");
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          console.warn("⚠️ FFmpeg live não respondeu a SIGTERM. Forçando SIGKILL...");
          proc.kill("SIGKILL");
        }
      }, 3000);
      proc.on("close", () => clearTimeout(timeout));
      liveProcess = null;
    }

    liveAtiva = false;
    console.log("⏹ Live local encerrada.");

    // 3. Retoma o buffer
    await new Promise((r) => setTimeout(r, 2000));
    if (!bufferAtivo()) {
      iniciarBuffer();
      console.log("▶ Buffer retomado");
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Erro ao parar live:", err.message);
    // Força estado seguro
    liveAtiva = false;
    liveProcess = null;
    broadcastIdAtual = null;
    if (!bufferAtivo()) {
      iniciarBuffer();
    }
    res.status(500).json({ erro: err.message });
  }
});

// ─── SERVIDOR + TECLADO ───

app.listen(3001, () => {
  console.log("🚀 Backend rodando em http://localhost:3001");
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", async (input) => {
  const tecla = input.trim().toLowerCase();
  if (tecla === "r") {
    if (uploadEmAndamento) {
      console.log("⏳ Upload anterior ainda em andamento.");
      return;
    }
    const videoPath = gerarReplay(quadraAtual);
    if (videoPath) {
      uploadEmAndamento = true;
      await uploadReplay(videoPath, quadraAtual);
      uploadEmAndamento = false;
    }
  }
  if (tecla === "s") {
    encerrarBuffer();
    if (liveProcess) {
      liveProcess.kill("SIGKILL");
      liveProcess = null;
    }
    process.exit(0);
  }
});
