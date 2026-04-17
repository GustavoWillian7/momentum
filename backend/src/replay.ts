import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { config } from "./config";

const BUFFER_DIR = path.join(__dirname, "..", "temp", "buffer");
const OUTPUT_DIR = path.join(__dirname, "..", "temp", "outputs");

export function gerarReplay(quadra: string): string | null {
  const arquivos = fs
    .readdirSync(BUFFER_DIR)
    .filter((f) => f.endsWith(".mp4"))
    .sort() // ordena alfabeticamente: segment_000, segment_001...
    
  // Ignora o último
  const disponiveis = arquivos.slice(0, -1);

  if (disponiveis.length === 0) {
    console.log("❌ Buffer insuficiente. Aguarde pelo menos 10 segundos.");
    return null;
  }

  // Pega no máximo os últimos 6
  const segmentosValidos = disponiveis.slice(-config.replaySegments);

  const concatPath = path.join(__dirname, "..", "temp", "concat.txt");
  const conteudo = segmentosValidos
    .map((f) => `file '${path.join(BUFFER_DIR, f).replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(concatPath, conteudo);

  const agora = new Date();
  const data = `${agora.getDate().toString().padStart(2, "0")}-${(agora.getMonth() + 1).toString().padStart(2, "0")}`;
  const hora = `${agora.getHours().toString().padStart(2, "0")}h${agora.getMinutes().toString().padStart(2, "0")}`;
  const nomeArquivo = `Replay_Quadra${quadra}_${data}_${hora}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, nomeArquivo);

  try {
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -t 30 -c copy "${outputPath}"`,
      { stdio: "pipe" }
    );
    console.log(`🎉 Replay salvo: ${nomeArquivo}`);
    return outputPath;
  } catch (err) {
    console.error("❌ Erro ao gerar replay:", err);
    return null;
  }
}