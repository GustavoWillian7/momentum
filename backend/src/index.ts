import * as readline from "readline";
import express from "express";
import cors from "cors";
import * as path from "path";
import * as fs from "fs";
import { iniciarBuffer, encerrarBuffer } from "./buffer";
import { gerarReplay } from "./replay";
import { spawn, ChildProcess } from "child_process";
import { uploadReplay, iniciarLiveYouTube, encerrarLiveYouTube, transicionarParaLive } from "./youtube";
import { config } from "./config";

const app = express();
app.use(cors());
app.use(express.json());

let quadraAtual = "1";
let liveAtiva = false;
let bufferAtivo = false;
let ultimoReplay: string | null = null;
let liveProcess: ChildProcess | null = null;
let broadcastIdAtual: string | null = null;

// Status
app.get("/api/status", (_, res) => {
  res.json({ 
    quadra: quadraAtual, 
    liveAtiva, 
    bufferAtivo, 
    ultimoReplay,
    liveUrl: broadcastIdAtual ? `https://youtube.com/watch?v=${broadcastIdAtual}` : null
  });
});

// Configuração
app.post("/api/config", (req, res) => {
  quadraAtual = req.body.quadra || "1";
  res.json({ ok: true });
});

// Buffer
app.post("/api/buffer/start", (req, res) => {
  if (bufferAtivo) {
    res.json({ ok: true, msg: "Buffer já estava ativo" });
    return;
  }
  iniciarBuffer();
  bufferAtivo = true;
  res.json({ ok: true });
});

// Replay
app.post("/api/replay", async (_, res) => {
  const videoPath = gerarReplay(quadraAtual);
  if (!videoPath) {
    res.status(400).json({ erro: "Buffer insuficiente" });
    return;
  }
  const videoId = await uploadReplay(videoPath, quadraAtual);
  ultimoReplay = new Date().toLocaleTimeString("pt-BR");
  res.json({ url: `https://youtube.com/watch?v=${videoId}` });
});

app.post("/api/live/start", async (_, res) => {
  try {
    // 1. Pausa o buffer e libera a câmera
    encerrarBuffer();
    bufferAtivo = false;
    console.log("⏸ Buffer pausado para liberar câmera para a live");

    await new Promise((r) => setTimeout(r, 4000));

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
      // 1. Captura de Vídeo
      "-f", "vfwcap",
      "-i", "0",
      
      // 2. Gerador de Áudio Silencioso
      "-f", "lavfi",
      "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
      
      // 3. Filtros de Vídeo (Corta, redimensiona e FORÇA 30fps cravados)
      "-vf", "crop=480:480:80:0,scale=640:480,fps=30",
      
      // 4. Configurações de Encode de Vídeo
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-tune", "zerolatency",
      "-b:v", "2500k",
      "-maxrate", "2500k",
      "-bufsize", "5000k",
      "-g", "60",
      
      // 5. Configurações de Encode de Áudio (AAC)
      "-c:a", "aac",
      "-b:a", "128k",
      
      // 6. Saída para o YouTube
      "-f", "flv",
      liveData.rtmp
    ];

    liveProcess = spawn("ffmpeg", args);

    liveProcess.stderr?.on("data", (data) => {
      const output = data.toString();
      // O \r faz o log sobrescrever a mesma linha, igual no cmd nativo do FFmpeg
      process.stdout.write(`[FFmpeg Live] ${output}`);
    });

    liveProcess.on("close", (code) => {
      console.log(`⚠️ FFmpeg Live encerrado com código ${code}`);
    });

    // 4. Como você usa enableAutoStart: true no youtube.ts, não precisamos
    // chamar transicionarParaLive() manualmente. O YouTube assume sozinho!
    liveAtiva = true;
    console.log(`🔴 Live iniciada localmente. O YouTube assumirá assim que receber o vídeo!`);
    res.json({ ok: true, url: `https://youtube.com/watch?v=${broadcastIdAtual}` });

  } catch (err: any) {
    console.error("❌ Erro no processo de live:", err.message);
    if (!bufferAtivo) {
      iniciarBuffer();
      bufferAtivo = true;
    }
    res.status(500).json({ erro: err.message });
  }
});

// Live stop
app.post("/api/live/stop", async (_, res) => {
  try {
    // 1. Avisa o YouTube que a transmissão acabou
    if (broadcastIdAtual) {
      console.log("⚙️ Encerrando evento na API do YouTube...");
      await encerrarLiveYouTube(broadcastIdAtual);
      broadcastIdAtual = null;
    }

    // 2. Mata o processo filho
    if (liveProcess) {
      liveProcess.kill("SIGTERM");
      liveProcess = null;
    }
    
    liveAtiva = false;
    console.log("⏹ Live local encerrada.");

    // 3. Retoma o buffer
    await new Promise((r) => setTimeout(r, 2000));
    iniciarBuffer();
    bufferAtivo = true;
    console.log("▶ Buffer retomado");

    res.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Erro ao parar live:", err.message);
    res.status(500).json({ erro: err.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 Backend rodando em http://localhost:3001");
});

// Teclado ainda funciona em paralelo
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", async (input) => {
  const tecla = input.trim().toLowerCase();
  if (tecla === "r") {
    const videoPath = gerarReplay(quadraAtual);
    if (videoPath) await uploadReplay(videoPath, quadraAtual);
  }
  if (tecla === "s") {
    encerrarBuffer();
    process.exit(0);
  }
});