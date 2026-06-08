# ❓ Dúvidas Frequentes — Respostas Técnicas

> Documento consolidado com as principais dúvidas levantadas sobre arquitetura, hardware e funcionamento do Momentum. Atualizado em: 07/06/2026.

---

## 1. Como funciona a rede durante a comunicação do replay?

### Rede privada dedicada?
**Não.** O sistema não exige uma rede privada complexa ou VLANs dedicadas. A topologia é uma **rede local simples** dentro da quadra.

### Fluxo de comunicação

```
┌──────────────┐      RTSP (Ethernet)       ┌─────────────────────┐
│  Câmera IP   │◄──────────────────────────►│  Mini PC / Raspberry│
└──────────────┘                            │         Pi 4B         │
                                            └──────────┬──────────┘
                                                       │
                                                       │ USB (HID)
                                                       ▼
                                            ┌─────────────────────┐
                                            │   Botão Arcade      │
                                            │  + Placa Zero Delay │
                                            └─────────────────────┘
                                                       │
                                                       │ WiFi / 4G
                                                       ▼
                                            ┌─────────────────────┐
                                            │      Internet       │
                                            │  (apenas para upload  │
                                            │    de replay/live)   │
                                            └─────────────────────┘
```

### Detalhamento por componente

| Trecho | Protocolo / Meio | Precisa de internet? |
|--------|-----------------|----------------------|
| **Câmera → Computador** | RTSP sobre cabo Ethernet | ❌ Não — é local |
| **Botão → Computador** | USB HID (simula teclado) | ❌ Não — é local |
| **Computador → YouTube** | HTTPS / RTMP via WiFi/4G | ✅ Sim — só aqui |

- **O replay é processado 100% localmente:** o computador concatena os segmentos de 5s em um .mp4 de 30s usando FFmpeg. Nenhum dado de vídeo sai da quadra nesse momento.
- **O upload para o YouTube** é que consome internet, e é feito em background (fire-and-forget) para não travar a interface.
- **O botão físico não usa rede:** ele é reconhecido pelo Windows/Linux como um teclado USB genérico. Quando apertado, "digita" uma letra (ex: `R`) que o backend escuta.

> ⚠️ **Atenção:** O backend atual escuta `stdin` (terminal). Se o terminal não estiver em foco, o botão pode não funcionar. Em produção, recomenda-se uma biblioteca de input global (ex: `node-global-key-listener`).

---

## 2. A câmera precisa de cabo? Quais são as opções de cabeamento?

### Sim — a câmera IP precisa de cabo Ethernet.

O sistema foi projetado para **câmeras IP com PoE** (Power over Ethernet), ou seja, **um único cabo de rede leva dados + energia** para a câmera.

### Opções de infraestrutura de cabeamento

| Opção | Componente | Como funciona | Melhor para |
|-------|-----------|---------------|-------------|
| **Injetor PoE** | TP-Link TL-POE150S | Câmera → cabo Ethernet (PoE) → Injetor → cabo normal → Mini PC. O injetor fica ligado na tomada. | **1 quadra** — mais barato e simples |
| **Switch PoE** | TP-Link TL-SG1005P | Câmera → cabo Ethernet (PoE) → Switch → cabo normal → Mini PC. O switch alimenta até 4 câmeras. | **Multi-quadra futura** ou se já houver rack/switch no local |

### Topologia mínima (Injetor PoE)

```
Tomada de energia
    └── Injetor PoE
            ├── Câmera IP ~~~~~~~~~~~~~~~~~~ cabo Ethernet (PoE) ~~~~~~~~~~~~~~~
            │         (distância máx. recomendada: 50m)
            └── Mini PC N100 / Raspberry ~~~~ cabo Ethernet (dados) ~~~~~~~~~~~~
                    ├── USB: Botão Arcade
                    └── WiFi/4G: Internet
```

### Observações importantes

- O **Mini PC N100 não tem porta PoE nativa**. Sem o injetor ou switch PoE, a câmera simplesmente não liga.
- O padrão **PoE 802.3af** suporta até **100m** oficialmente, mas o projeto recomenda **máximo 50m** na prática para garantir estabilidade do stream RTSP.
- O briefing original menciona que também é possível usar **câmeras USB (UVC)** como alternativa, mas o código atual do Momentum foca em **câmera IP + RTSP**.
- O Raspberry Pi 4B também **não tem PoE nativo** — precisaria de um HAT PoE separado, ou usar injetor/switch como o N100.

---

## 3. Switch e Botoeira — funcionamento detalhado

### Switch PoE

Um **switch PoE** é um hub de rede que fornece energia elétrica através do cabo Ethernet.

| Característica | Descrição |
|----------------|-----------|
| **Modelo citado** | TP-Link TL-SG1005P (5 portas Gigabit, 4 com PoE) |
| **Função no sistema** | Distribui a conexão de rede e alimenta a(s) câmera(s) simultaneamente |
| **Vantagem** | Permite escalar para várias quadras sem trocar a infraestrutura de rede |
| **Quando usar** | Se planeja expandir para multi-quadra, ou se já possui um rack de rede no local |

### Botoeira (Botão Arcade + Placa Zero Delay)

A interface física do replay, projetada para **"intervenção técnica zero"**.

| Característica | Descrição |
|----------------|-----------|
| **Componentes** | Botão tipo arcade 30mm (robusto, resistente a poeira e impacto) + placa Zero Delay + cabos jumper |
| **Comunicação** | **USB HID** — o Windows/Linux reconhece automaticamente como teclado/joystick. Não precisa de driver. |
| **Funcionamento** | Ao apertar, o botão "digita" uma letra (ex: `R`) no computador. O backend escuta essa tecla e dispara a geração do replay. |
| **LEDs** | O briefing original prevê LED **azul** no botão de replay (processando/upload) e LED **vermelho** na alavanca de live (ao vivo). |

### Teste rápido da botoeira

1. Conecte a placa Zero Delay via USB.
2. Abra o **Bloco de Notas** no computador.
3. Aperte o botão.
4. Se aparecer a letra `R`, a placa está funcionando corretamente como teclado HID.

> 💡 **Dica de compra:** Se você quer **apenas 1 botão "Replay"** (sem joystick), compre somente 1 botão arcade + placa zero delay. Kits assim custam cerca de **R$ 60** na Shopee.

---


## 4. Encerramento automático de live — existe algum mecanismo?

### Resposta curta: Não.

Hoje, o sistema **não possui nenhum mecanismo automático de encerramento por tempo**.

### O que acontece se eu esquecer a live ligada?

Se você iniciar a live às 20h e não clicar em **"Encerrar Live"** no painel web, a transmissão continuará rodando indefinidamente enquanto:

- O processo FFmpeg estiver vivo e enviando frames
- A conexão de internet estiver estável
- O computador não desligar, travar ou reiniciar

### Gatilhos de parada que existem hoje

| Gatilho | O que acontece | Controlado pelo código? |
|---------|---------------|------------------------|
| **Clique em "Encerrar Live"** | Envia `SIGTERM` pro FFmpeg, notifica YouTube via API, retoma buffer | ✅ Sim — único mecanismo intencional |
| **FFmpeg morre sozinho** | O evento `liveProcess.on('close')` detecta, marca `liveAtiva = false`, e retoma o buffer | ✅ Sim — mas é reação a falha, não controle |
| **Internet cai** | YouTube dropa o stream após alguns segundos sem pacotes | ❌ Parcial — o YouTube encerra o broadcast no lado dele, mas o código local pode não saber imediatamente |
| **`enableAutoStop: true`** | Configuração na criação do broadcast (API YouTube). Encerra o evento no YouTube quando o stream RTMP para de chegar. | ⚠️ Indireto — funciona se o FFmpeg morrer, mas não limita duração |

### Limite da plataforma YouTube

O próprio YouTube impõe um **limite máximo de duração para streams RTMP via API** (geralmente em torno de **12 horas**), após o qual a plataforma pode cortar o stream independentemente do seu código. Mesmo assim, deixar a live aberta acidentalmente é problemático:

- Consome **banda de upload** continuamente
- Gasta **cota da API do Google Cloud** (live ativa consome recursos)
- Produz um **vídeo longo e provavelmente inútil** no canal do cliente
- Pode gerar **problemas de privacidade** se a câmera ficar filmando após o evento

### Sugestões de melhoria futura (com detalhes de implementação)

#### Opção A — Timeout hardcoded no backend
No `index.ts`, após iniciar a live com sucesso, agendar um `setTimeout` que chama a mesma lógica de `/api/live/stop` automaticamente após um limite.

```typescript
// Exemplo de implementação
const MAX_LIVE_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas
let liveTimeout: NodeJS.Timeout | null = null;

// Dentro de /api/live/start, após liveAtiva = true:
liveTimeout = setTimeout(() => {
  console.warn("⏰ Live atingiu tempo máximo. Encerrando automaticamente...");
  // Chama a mesma lógica de /api/live/stop
  axios.post("http://localhost:3001/api/live/stop").catch(() => {});
}, MAX_LIVE_DURATION_MS);

// Dentro de /api/live/stop, antes de retomar:
if (liveTimeout) {
  clearTimeout(liveTimeout);
  liveTimeout = null;
}
```

**Vantagem:** Seguro — não depende do operador.  
**Desvantagem:** Pode encerrar no meio de um evento longo (ex: campeonato com transmissão contínua).

---

#### Opção B — Alerta sonoro + visual no painel
O frontend monitora o tempo de live via polling e emite alertas crescentes:

| Tempo de live | Ação no painel |
|---------------|----------------|
| 30 minutos | Banner amarelo: *"Live ativa há 30 min."* |
| 1 hora | Banner laranja + beep curto no buzzer/caixa de som |
| 2 horas | Banner vermelho piscante + beep contínuo |

**Como implementar:** Adicionar campo `liveStartTime` no `/api/status`. O frontend calcula `Date.now() - liveStartTime` a cada poll (2s) e dispara os alertas.

**Vantagem:** Dá controle ao operador — ele decide se encerra ou continua.  
**Desvantagem:** Se ninguém estiver olhando o painel, a live continua.

---

#### Opção C — Configuração de duração máxima por evento
No painel web, adicionar um campo *"Duração máxima da live"* (dropdown: 1h, 2h, 4h, Ilimitado). O backend agenda o encerramento conforme a escolha.

```typescript
// config.ts
export const config = {
  // ...outros campos
  maxLiveDurationMinutes: 120, // 0 = ilimitado
};
```

**Vantagem:** Flexível — campeonatos longos podem usar 4h, treinos comuns 1h.  
**Desvantagem:** Requer mudança no frontend (novo campo) e no backend (ler config).

---

#### Opção D — Sensor de ausência (modo "quadra vazia")
Se a câmera IP suportar detecção de movimento (VCA/IVS), ou se adicionarmos um sensor de presença/barulho, o sistema pode encerrar a live automaticamente se não detectar movimento/ruído por mais de X minutos. Isso evita lives "fantasma" quando todo mundo foi embora.

**Vantagem:** Inteligente — não depende de tempo fixo.  
**Desvantagem:** Requer câmera com VCA ou hardware adicional (sensor PIR, microfone com threshold).

---

## 5. Feedback sonoro (beeps/sirene) ao gerar replay ou iniciar/encerrar live

### Ideia — Alertas sonoros para o operador na quadra

Hoje, o operador só recebe feedback **visual** (painel web, LEDs no botão). Em uma quadra barulhenta, com pessoas gritando e bola batendo, é fácil não perceber que o replay foi gerado ou que a live caiu. Adicionar **sons curtos e distintos** melhora a usabilidade drasticamente.

### Sugestões de implementação

#### Opção A — Caixa de som USB simples (recomendada)
Conectar uma **caixa de som USB** ou alto-falante de PC no Mini PC / Raspberry. O backend emite arquivos de áudio pré-gravados via linha de comando.

**Tecnologia:**
- **Windows:** `powershell -c (New-Object Media.SoundPlayer "replay.wav").PlaySync()`
- **Linux (Raspberry):** `aplay /opt/momentum/sounds/replay.wav` ou `paplay replay.ogg`

**Eventos e sons sugeridos:**

| Evento | Som | Frequência | Objetivo |
|--------|-----|------------|----------|
| **Replay gerado com sucesso** | Beep curto ("ding") | 1x | Confirmar que o clique do botão funcionou |
| **Upload do replay concluído** | Som de "sucesso" ("tada") | 1x | Confirmar que o vídeo está no YouTube |
| **Live iniciada** | Som de "início" ("vroom" ou fanfarra curta) | 1x | Informar que a transmissão está no ar |
| **Live encerrada** | Som de "fim" ("buzina curta descendente") | 1x | Confirmar que a transmissão parou |
| **Erro grave** (live caiu, buffer parou) | Beep longo e contínuo | Repetir a cada 10s | Chamar atenção do operador para olhar o painel |

**Implementação no `index.ts`:**

```typescript
import { exec } from "child_process";

function playSound(nome: string) {
  const caminho = path.join(__dirname, "..", "sounds", `${nome}.wav`);
  const isWin = process.platform === "win32";
  const cmd = isWin
    ? `powershell -c (New-Object Media.SoundPlayer "${caminho}").PlaySync()`
    : `aplay "${caminho}"`;
  exec(cmd, { windowsHide: true }); // windowsHide evita janela do PowerShell piscando
}

// Usar nos endpoints:
playSound("replay-ok");      // após gerarReplay()
playSound("live-start");     // após liveAtiva = true
playSound("live-stop");      // após encerrar live
playSound("erro-grave");     // no catch de falhas críticas
```

**Arquivos de som:** Podem ser gerados gratuitamente com ferramentas como [freesound.org](https://freesound.org) ou sintetizados com `ffmpeg`:

```bash
# Gerar um beep de 200ms, 1000Hz
ffmpeg -f lavfi -i "sine=frequency=1000:duration=0.2" -ac 1 replay-beep.wav
```

---

#### Opção B — Buzzer GPIO no Raspberry Pi
Se o hardware for um **Raspberry Pi**, é possível usar um **buzzer piezoelétrico** conectado diretamente aos pinos GPIO (sem precisar de caixa de som USB).

**Conexão:**
- Pino GPIO 18 (ou outro com PWM) → resistor 1kΩ → Buzzer (+)
- GND → Buzzer (-)

**Biblioteca:** `onoff` ou `pigpio` no Node.js.

```typescript
import { Gpio } from "onoff";
const buzzer = new Gpio(18, "out");

function beep(duracaoMs = 200) {
  buzzer.writeSync(1);
  setTimeout(() => buzzer.writeSync(0), duracaoMs);
}

// Padrões:
beep(100); // replay ok
beep(200); beep(200); beep(200); // erro grave (3 beeps)
```

**Vantagem:** Zero custo extra (buzzer custa R$ 2–5), não depende de driver de áudio do Linux.  
**Desvantagem:** Só funciona no Raspberry Pi (ou Arduino/ESP32 anexado). Não funciona no Mini PC N100 sem GPIO.

---

#### Opção C — Display OLED com beep integrado (modo "Arcade completo")
O briefing original cita um **Display OLED/LCD** de status. Existem displays I2C pequenos (0.96" SSD1306) que podem vir com buzzer integrado ou podem ser acoplados a um buzzer. Isso cria um console físico completo:

- **Display:** mostra "AO VIVO — 01:23:00" ou "REPLAY ENVIADO"
- **Buzzer:** confirma as ações com beeps
- **LEDs:** vermelho (live) / azul (replay) como já previsto no briefing

**Vantagem:** Feedback visual + sonoro + luminoso num só ponto físico na quadra.  
**Desvantagem:** Requer desenvolvimento de firmware adicional (se usar Arduino/Pico) ou bibliotecas GPIO no Raspberry.

---

### Resumo recomendado

| Hardware | Melhor opção de som |
|----------|---------------------|
| **Mini PC N100 (Windows)** | Caixa de som USB + arquivos WAV via PowerShell |
| **Raspberry Pi 4B** | Buzzer GPIO (barato e confiável) ou caixa de som USB |
| **Setup profissional futuro** | Display OLED + buzzer + LEDs (console arcade dedicado) |

---

## 6. É possível embarcar o sistema no Raspberry Pi 4B? Como seria?

### Resposta: Sim, é possível. Não é o hardware-alvo, mas funciona como uma versão "embarcada" completa.

O briefing menciona "Raspberry Pi Pico ou Arduino Leonardo" apenas para a interface de botões (HID). No entanto, o **Raspberry Pi 4 Modelo B (4GB)** tem poder de processamento suficiente para rodar o **backend (Node.js + FFmpeg)** e servir o **frontend (React + Vite)** localmente. Isso transforma o Pi em uma solução **standalone** — não precisa de notebook ou Mini PC separado.

### O que muda para embarcar no Pi 4B?

| Camada | No N100 (atual) | No Raspberry Pi 4B |
|--------|----------------|---------------------|
| **Sistema Operacional** | Windows 11 | **Raspberry Pi OS (64-bit)** ou Ubuntu Server 22.04 ARM64 |
| **Captura de câmera** | `vfwcap` (webcam) ou RTSP | **Apenas RTSP** — `vfwcap` é Windows-only. Câmera USB (UVC) também funciona via `/dev/video0`. |
| **FFmpeg** | Instalador executável (.exe) | `sudo apt install ffmpeg` (versão do repositório). Idealmente compilar com suporte a `h264_v4l2m2m`. |
| **Node.js** | Download do site (x64) | **ARM64 build** via `nvm` ou pacotes oficiais da NodeSource. |
| **OAuth / Autenticação** | `exec('start ...')` abre navegador | **Falha em headless.** Solução: autenticar em outra máquina, copiar `token.json` e `credentials.json`. |
| **Aceleração de vídeo** | Intel QuickSync | **VideoCore VI** (`h264_v4l2m2m` para decode/encode). Ajuda, mas não é tão potente quanto QuickSync. |
| **Frontend** | `npm run dev` (Vite dev server) | **Funciona**, mas recomenda-se fazer `npm run build` e servir os arquivos estáticos com Express (ou Nginx). |
| **Botão físico** | USB HID Zero Delay | ✅ **Funciona igual** — Linux reconhece como teclado genérico. |
| **Som/Beep** | PowerShell + caixa de som | `aplay` + caixa de som USB, ou **buzzer GPIO** (ver seção 5). |
| **Inicialização automática** | Atalho na pasta Inicializar ou serviço Windows | **Systemd service** — roda o backend como daemon no boot. |

### Passo a passo para embarcar no Raspberry Pi 4B

#### Passo 1 — Preparar o sistema operacional

1. Grave o **Raspberry Pi OS Lite (64-bit)** ou **Ubuntu Server 22.04 ARM64** no cartão SD (use Raspberry Pi Imager).
2. Habilite SSH e configure WiFi no `imager` antes do primeiro boot (ou use cabo Ethernet).
3. Boot o Pi, acesse via SSH (`ssh pi@ip-do-pi`).

#### Passo 2 — Instalar dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (via NodeSource para versão LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node -v  # v20.x
npm -v   # 10.x

# Instalar FFmpeg
sudo apt install -y ffmpeg

# Verificar suporte a aceleração de hardware
ffmpeg -encoders | grep h264_v4l2m2m
# Se aparecer, o Pi pode usar aceleração de hardware para encode/decode H.264
```

#### Passo 3 — Copiar o projeto

```bash
# Opção A: git clone (se repo for público ou se você tiver chave SSH)
git clone https://github.com/seu-usuario/momentum.git

# Opção B: copiar via SCP do seu notebook
# No notebook Windows/PowerShell:
scp -r .\momentum pi@192.168.1.X:/home/pi/
```

#### Passo 4 — Configurar o backend para Linux

1. **Migrar `buffer.ts` para RTSP** — substituir `vfwcap` pelo input RTSP da câmera IP.
2. **Ajustar caminhos de som** (se implementar feedback sonoro) — usar `aplay` em vez de PowerShell.
3. **Copiar `credentials.json` e `token.json`** para `backend/` (gerados em outra máquina).

#### Passo 5 — Instalar dependências e testar

```bash
cd /home/pi/momentum/backend
npm install

# Testar buffer manualmente
npx ts-node src/index.ts
```

#### Passo 6 — Servir o frontend de forma otimizada

O `npm run dev` do Vite consome recursos e não é ideal para produção. O melhor é fazer build e servir estático:

```bash
cd /home/pi/momentum/frontend
npm install
npm run build

# Copiar a pasta dist/ para ser servida pelo Express do backend
# Ou usar um servidor web leve:
sudo apt install nginx
# Configurar nginx para servir /home/pi/momentum/frontend/dist
# e fazer proxy de /api para localhost:3001
```

Alternativa mais simples: usar o próprio Express do backend para servir os arquivos estáticos do `dist/`:

```typescript
// Em backend/src/index.ts
app.use(express.static(path.join(__dirname, "../../frontend/dist")));
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});
```

#### Passo 7 — Criar serviço Systemd (inicialização automática)

Criar o arquivo `/etc/systemd/system/momentum.service`:

```ini
[Unit]
Description=Momentum Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/momentum/backend
ExecStart=/usr/bin/npx ts-node src/index.ts
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable momentum
sudo systemctl start momentum

# Verificar logs
sudo journalctl -u momentum -f
```

#### Passo 8 — Acessar o painel

- Acesse `http://IP-DO-RASPBERRY` (se configurou Nginx/Express para servir o frontend).
- Ou acesse `http://IP-DO-RASPBERRY:3001` para a API direta.

### Limitações do Raspberry Pi 4B em produção

| Aspecto | Limitação | Mitigação |
|---------|-----------|-----------|
| **CPU** | ARM Cortex-A72 (4 núcleos) — bem inferior ao N100 | Não rodar buffer + live simultâneos em alta resolução. Usar aceleração `h264_v4l2m2m`. |
| **RAM** | 4GB — suficiente, mas sem folga | Fechar serviços desnecessários. Não rodar desktop (use Pi OS Lite). |
| **Armazenamento** | Cartão SD — lento e propenso a corrupção | Usar **SSD externo via USB 3.0** (disco SATA com case USB) em vez de SD. |
| **Temperatura** | Sem cooler, facilmente passa de 80°C em uso contínuo | Heatsink + cooler ativo obrigatórios. Case com ventilação. |
| **PoE** | Não nativo | Usar HAT PoE oficial (custa ~R$ 80–120) ou injetor/switch externo. |
| **Aceleração de vídeo** | VideoCore VI ajuda, mas não é QuickSync | Reduzir resolução/bitrate da live para 720p30 ou 480p. |

### Veredicto

| Cenário | Viável no Pi 4B? |
|---------|-----------------|
| **Prova de conceito / teste de campo** | ✅ **Sim** — ideal para validar RTSP + rede + botão antes de comprar o N100 |
| **Produção leve** (1 quadra, replays apenas, live ocasional) | ✅ **Sim** — desde que use SSD externo, cooler e Pi OS Lite |
| **Produção intensa** (buffer + live simultâneos, 2h+ de live, multi-quadra) | ❌ **Não recomendado** — N100 ou superior é necessário |

---

## 📎 Referências

- `docs/HARDWARE.md` — lista de compras e estratégia de teste
- `docs/OPERACAO.md` — instalação física e fluxo do dia de jogo
- `docs/TROUBLESHOOTING.md` — diagnóstico de campo
- `docs/CLIENTE.md` — guia não-técnico para o cliente final
- `README.md` — configuração de câmera e variáveis
- `backend/src/index.ts` — rotas da API e máquina de estados
- `backend/src/youtube.ts` — integração com YouTube Live API
- `briefing-momentum.pdf` — requisitos originais e arquitetura de hardware
- `analise-tecnica.pdf` — requisitos funcionais, não-funcionais e regras de negócio
