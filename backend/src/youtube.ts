import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as url from "url";

const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
];

// ─── UTILITÁRIOS DE RESILIÊNCIA ───

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${label} excedeu ${ms}ms`));
    }, ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < maxRetries) {
        console.warn(`⚠️ Tentativa ${i + 1} falhou. Retentando em ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

// ─── AUTH ───

function carregarCredenciais() {
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const { installed } = JSON.parse(raw);
  return new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    "http://localhost:3000"
  );
}

async function autenticar(): Promise<OAuth2Client> {
  const auth = carregarCredenciais();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
    auth.setCredentials(token);
    return auth;
  }

  return new Promise((resolve, reject) => {
    const authUrl = auth.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("\n🔐 Abrindo navegador para autenticação...");
    console.log("Se não abrir automaticamente, acesse:\n", authUrl);

    // Abre o browser automaticamente
    const { exec } = require("child_process");
    exec(`start "" "${authUrl}"`);

    // Sobe um servidor local para capturar o código de retorno
    const server = http.createServer(async (req, res) => {
      const queryParams = url.parse(req.url || "", true).query;
      const code = queryParams.code as string;

      if (!code) {
        res.end("Nenhum código recebido.");
        return;
      }

      res.end(`
        <h2>✅ Autenticação concluída!</h2>
        <p>Pode fechar essa aba e voltar ao terminal.</p>
      `);
      server.close();

      try {
        const { tokens } = await auth.getToken(code);
        auth.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log("✅ Token salvo em token.json");
        resolve(auth);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(3000, () => {
      console.log("⏳ Aguardando retorno do Google...");
    });
  });
}

// ─── API COM TIMEOUT + RETRY ───

export async function uploadReplay(
  videoPath: string,
  quadra: string
): Promise<string | null> {
  try {
    const auth = await withTimeout(autenticar(), 30000, "autenticação");
    const youtube = google.youtube({ version: "v3", auth });

    const agora = new Date();
    const data = `${agora.getDate().toString().padStart(2, "0")}/${(agora.getMonth() + 1).toString().padStart(2, "0")}`;
    const hora = `${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}`;

    const titulo = `Replay - Quadra ${quadra} - ${data} às ${hora}`;

    console.log(`\n📤 Fazendo upload: "${titulo}"`);

    const response = await withRetry(async () => {
      return await withTimeout(
        youtube.videos.insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: titulo,
              description: `Replay automático gerado pelo Momentum.\nQuadra ${quadra} - ${data} às ${hora}`,
              tags: ["replay", "futebol", "futsal", "shorts"],
              categoryId: "17", // Esportes
            },
            status: {
              privacyStatus: "public",
            },
          },
          media: {
            body: fs.createReadStream(videoPath),
          },
        }),
        120000,
        "upload de vídeo"
      );
    }, 2, 2000);

    const videoId = response.data.id;
    console.log(`✅ Upload concluído! https://youtube.com/watch?v=${videoId}`);
    return videoId || null;
  } catch (err: any) {
    console.error("❌ Erro no upload:", err.message);
    return null;
  }
}

export async function iniciarLiveYouTube(quadra: string): Promise<{ rtmp: string; broadcastId: string } | null> {
  try {
    const auth = await withTimeout(autenticar(), 30000, "autenticação");
    const youtube = google.youtube({ version: "v3", auth });

    const agora = new Date();
    const data = `${agora.getDate().toString().padStart(2, "0")}/${(agora.getMonth() + 1).toString().padStart(2, "0")}`;
    const hora = `${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}`;

    const broadcast = await withRetry(async () => {
      return await withTimeout(
        youtube.liveBroadcasts.insert({
          part: ["snippet", "status", "contentDetails"],
          requestBody: {
            snippet: {
              title: `Ao Vivo — Quadra ${quadra} - ${data} às ${hora}`,
              scheduledStartTime: new Date().toISOString(),
            },
            status: { privacyStatus: "public" },
            contentDetails: {
              enableAutoStart: true,
              enableAutoStop: true,
              enableDvr: true,
            },
          },
        }),
        15000,
        "criação de broadcast"
      );
    }, 2, 1500);

    const broadcastId = broadcast.data.id!;

    const stream = await withRetry(async () => {
      return await withTimeout(
        youtube.liveStreams.insert({
          part: ["snippet", "cdn"],
          requestBody: {
            snippet: { title: `Stream Quadra ${quadra}` },
            cdn: {
              frameRate: "30fps",
              ingestionType: "rtmp",
              resolution: "480p",
            },
          },
        }),
        15000,
        "criação de stream"
      );
    }, 2, 1500);

    const streamId = stream.data.id!;
    const rtmpUrl = stream.data.cdn?.ingestionInfo?.ingestionAddress!;
    const streamKey = stream.data.cdn?.ingestionInfo?.streamName!;

    await withTimeout(
      youtube.liveBroadcasts.bind({
        part: ["id", "contentDetails"],
        id: broadcastId,
        streamId: streamId,
      }),
      15000,
      "bind broadcast"
    );

    console.log(`📡 RTMP: ${rtmpUrl}/${streamKey}`);
    console.log(`🔗 Live: https://youtube.com/watch?v=${broadcastId}`);

    return { rtmp: `${rtmpUrl}/${streamKey}`, broadcastId };
  } catch (err: any) {
    console.error("❌ Erro ao criar live:", err.message);
    return null;
  }
}

export async function encerrarLiveYouTube(broadcastId: string): Promise<void> {
  try {
    const auth = await withTimeout(autenticar(), 30000, "autenticação");
    const youtube = google.youtube({ version: "v3", auth });

    await withTimeout(
      youtube.liveBroadcasts.transition({
        part: ["status"],
        broadcastStatus: "complete",
        id: broadcastId,
      }),
      15000,
      "encerrar live"
    );

    console.log("⏹ Live encerrada.");
  } catch (err: any) {
    console.error("❌ Erro ao encerrar live:", err.message);
    throw err; // Propaga para quem chamou saber que falhou
  }
}

export async function transicionarParaLive(broadcastId: string): Promise<void> {
  const auth = await withTimeout(autenticar(), 30000, "autenticação");
  const youtube = google.youtube({ version: "v3", auth });

  try {
    await withTimeout(
      youtube.liveBroadcasts.transition({
        part: ["status"],
        broadcastStatus: "live",
        id: broadcastId,
      }),
      15000,
      "transição para live"
    );
    console.log("🔴 Broadcast transicionado para LIVE!");
  } catch (err: any) {
    console.log("⚠️  Transição para live falhou:", err.message);
  }
}
