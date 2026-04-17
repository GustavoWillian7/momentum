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

export async function uploadReplay(
  videoPath: string,
  quadra: string
): Promise<string | null> {
  try {
    const auth = await autenticar();
    const youtube = google.youtube({ version: "v3", auth });

    const agora = new Date();
    const data = `${agora.getDate().toString().padStart(2, "0")}/${(agora.getMonth() + 1).toString().padStart(2, "0")}`;
    const hora = `${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}`;

    const titulo = `⚽ Replay - Quadra ${quadra} - ${data} às ${hora} #Shorts`;

    console.log(`\n📤 Fazendo upload: "${titulo}"`);

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: titulo,
          description: `Replay automático gerado pela caixinha.\nQuadra ${quadra} - ${data} às ${hora}`,
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
    });

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
    const auth = await autenticar();
    const youtube = google.youtube({ version: "v3", auth });

    const agora = new Date();
    const data = `${agora.getDate().toString().padStart(2, "0")}/${(agora.getMonth() + 1).toString().padStart(2, "0")}`;
    const hora = `${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}`;

    const broadcast = await youtube.liveBroadcasts.insert({
      part: ["snippet", "status", "contentDetails"],
      requestBody: {
        snippet: {
          title: `🔴 Ao Vivo — Quadra ${quadra} - ${data} às ${hora}`,
          scheduledStartTime: new Date().toISOString(),
        },
        status: { privacyStatus: "public" },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          enableDvr: true,
        },
      },
    });

    const broadcastId = broadcast.data.id!;

    const stream = await youtube.liveStreams.insert({
      part: ["snippet", "cdn"],
      requestBody: {
        snippet: { title: `Stream Quadra ${quadra}` },
        cdn: {
          frameRate: "30fps",
          ingestionType: "rtmp",
          resolution: "480p",
        },
      },
    });

    const streamId = stream.data.id!;
    const rtmpUrl = stream.data.cdn?.ingestionInfo?.ingestionAddress!;
    const streamKey = stream.data.cdn?.ingestionInfo?.streamName!;

    await youtube.liveBroadcasts.bind({
      part: ["id", "contentDetails"],
      id: broadcastId,
      streamId: streamId,
    });

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
    const auth = await autenticar();
    const youtube = google.youtube({ version: "v3", auth });

    await youtube.liveBroadcasts.transition({
      part: ["status"],
      broadcastStatus: "complete",
      id: broadcastId,
    });

    console.log("⏹ Live encerrada.");
  } catch (err: any) {
    console.error("❌ Erro ao encerrar live:", err.message);
  }
}

export async function transicionarParaLive(broadcastId: string): Promise<void> {
  const auth = await autenticar();
  const youtube = google.youtube({ version: "v3", auth });

  try {
    await youtube.liveBroadcasts.transition({
      part: ["status"],
      broadcastStatus: "live",
      id: broadcastId,
    });
    console.log("🔴 Broadcast transicionado para LIVE!");
  } catch (err: any) {
    console.log("⚠️  Transição para live falhou:", err.message);
  }
}