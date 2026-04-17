# 🏖️ Momentum — Automated Sports Replay System

Sistema de automação de transmissões esportivas com geração instantânea de replays e envio automático para o YouTube. Desenvolvido para quadras e campos esportivos, com foco em **simplicidade de uso** — sem necessidade de operadores técnicos.

---

## 📌 Visão Geral

O Momentum permite:

- Iniciar uma transmissão ao vivo no YouTube com um único botão
- Manter um buffer contínuo de vídeo (gravação temporária dos últimos ~40s)
- Gerar um clipe de replay dos últimos 30 segundos sob demanda
- Publicar o replay automaticamente no YouTube como **Short** (vertical, < 60s)
- Identificar cada vídeo com **quadra e horário** no título automaticamente

---

## 🗂️ Estrutura do Projeto

```
momentum/
├── backend/
│   ├── src/
│   │   ├── index.ts         # Servidor Express + listener de teclado
│   │   ├── buffer.ts        # Captura de câmera e buffer de segmentos (FFmpeg)
│   │   ├── replay.ts        # Concatenação dos segmentos e geração do .mp4
│   │   ├── youtube.ts       # Autenticação OAuth2 + upload + live streaming
│   │   └── config.ts        # Configurações globais (duração de segmento, stream key, etc.)
│   ├── temp/
│   │   ├── buffer/          # Segmentos de vídeo temporários (auto-deletados)
│   │   └── outputs/         # Replays gerados
│   ├── credentials.json     # Credenciais OAuth2 do Google Cloud (não versionar)
│   ├── token.json           # Token de acesso salvo após primeira autenticação (não versionar)
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   └── App.tsx          # Painel de controle React (single file)
    ├── vite.config.ts
    └── package.json
```

---

## ⚙️ Pré-requisitos

- **Node.js** 18+
- **FFmpeg** instalado e adicionado ao PATH do sistema
- **Conta Google** com canal no YouTube habilitado para transmissões ao vivo
- **Projeto no Google Cloud** com as APIs abaixo ativadas:
  - YouTube Data API v3
  - YouTube Live Streaming API

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/momentum.git
cd momentum
```

### 2. Instale as dependências do backend

```bash
cd backend
npm install
```

### 3. Instale as dependências do frontend

```bash
cd ../frontend
npm install
```

---

## 🔑 Configuração do Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e crie um novo projeto
2. Ative as APIs:
   - **YouTube Data API v3**
   - **YouTube Live Streaming API**
3. Em **Credenciais**, crie um **ID do cliente OAuth 2.0** do tipo *Aplicativo para computador*
4. Baixe o JSON e salve como `backend/credentials.json`
5. Em **Tela de consentimento OAuth**, adicione o e-mail do canal como usuário de teste
6. Habilite transmissões ao vivo no canal em [youtube.com/features](https://youtube.com/features) (pode levar até 24h para ativar)

> ⚠️ **Nunca versione** `credentials.json` e `token.json`. Ambos já estão no `.gitignore`.

---

## 🎥 Configuração da Câmera

O sistema usa **`vfwcap`** (Video for Windows) para capturar a câmera no Windows. Para descobrir o índice da câmera disponível:

```bash
ffmpeg -f vfwcap -i dummy
```

Por padrão o sistema usa o índice `0` (primeira câmera). Para alterar, edite `src/buffer.ts`:

```typescript
"-i", "0",  // altere para "1", "2", etc. se necessário
```

### Câmeras IP (RTSP)

Para usar câmeras IP em vez da webcam, substitua o bloco de input no `buffer.ts`:

```typescript
// Troque:
"-f", "vfwcap",
"-i", "0",

// Por:
"-rtsp_transport", "tcp",
"-i", "rtsp://usuario:senha@192.168.1.100/stream",
```

Certifique-se de que a câmera suporta os protocolos **RTSP** e **ONVIF**.

---

## 🔧 Variáveis de Configuração

Edite `backend/src/config.ts` para ajustar o comportamento do sistema:

```typescript
export const config = {
  webcamName: "Integrated Camera", // legado, não usado com vfwcap
  segmentDuration: 5,               // duração de cada segmento em segundos
  maxSegments: 8,                   // máximo de segmentos mantidos em disco
  replaySegments: 6,                // segmentos usados para gerar o replay
  streamKey: "xxxx-xxxx-xxxx-xxxx", // stream key permanente do YouTube Studio
  rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
};
```

| Parâmetro | Efeito |
|-----------|--------|
| `segmentDuration` | Granularidade do buffer. Valores menores = mais arquivos, maior precisão |
| `maxSegments` | `maxSegments × segmentDuration` = total de segundos no buffer |
| `replaySegments` | `replaySegments × segmentDuration` = duração máxima antes do corte em `-t 30` |
| `streamKey` | Chave de stream permanente obtida no YouTube Studio |
| `rtmpUrl` | URL base RTMP do YouTube (raramente muda) |

### Como obter a Stream Key permanente

1. Acesse **studio.youtube.com**
2. Clique no ícone de transmissão ao vivo no menu lateral
3. Escolha **"Software de streaming"**
4. Copie a **Chave de transmissão** exibida na tela
5. Cole no campo `streamKey` do `config.ts`

---

## ▶️ Rodando o Projeto

Abra dois terminais:

**Terminal 1 — Backend:**
```bash
cd backend
npx ts-node src/index.ts
```

O backend sobe na porta `3001`. Na primeira execução, o browser abre automaticamente para autenticação OAuth com o Google.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no browser.

---

## 🎮 Como Usar

1. No painel lateral, informe o **número da quadra** e pressione Enter (ou clique fora do campo)
2. Clique em **Iniciar Captura** para ligar a câmera e o buffer
3. Aguarde pelo menos **30 segundos** para o buffer acumular
4. Clique em **Gerar Replay** para cortar e publicar os últimos 30s como Short
5. Clique em **Iniciar Live** para criar o evento e começar a transmissão ao vivo

### Atalhos de teclado (terminal do backend)

| Tecla | Ação |
|-------|------|
| `R` + Enter | Gerar e fazer upload do replay |
| `S` + Enter | Encerrar captura e sair |

---

## 📐 Como Funciona o Buffer

O FFmpeg grava a câmera em segmentos de **5 segundos** continuamente:

```
segment_000.mp4  segment_001.mp4  segment_002.mp4 ... (máx. 8 arquivos)
```

Quando o 9º segmento é criado, o mais antigo é deletado automaticamente — mantendo sempre ~40s de buffer em disco.

Ao acionar o replay:
1. Os últimos 6 segmentos válidos são selecionados (ignorando o segmento atual, que pode estar incompleto)
2. O FFmpeg os concatena em um único arquivo com `-c copy` (sem re-encoding)
3. O vídeo final é cortado em exatamente **30 segundos** com `-t 30`
4. O arquivo é enviado ao YouTube via API

---

## 📡 Como Funciona a Live

A transmissão ao vivo usa o FFmpeg diretamente, sem scripts intermediários:

1. O buffer é pausado para liberar a câmera
2. A API do YouTube cria um novo evento de broadcast com `enableAutoStart: true`
3. O FFmpeg captura a webcam e envia via RTMP para o YouTube, incluindo **áudio sintético** (`anullsrc`) — necessário para o YouTube aceitar o stream
4. O YouTube coloca a live no ar automaticamente ao detectar o sinal estável
5. Ao encerrar, a API finaliza o broadcast e o buffer é retomado automaticamente

> ℹ️ O YouTube pode levar entre 20 e 60 segundos para processar o sinal e exibir a live publicamente após o início do stream.

---

## 📹 Formato dos Vídeos

Os replays são publicados como **YouTube Shorts**:

- Resolução: **640x480** (recortado e reescalonado internamente pelo FFmpeg)
- Duração: **30 segundos**
- Título: `⚽ Replay - Quadra {N} - {DD/MM} às {HH}h{MM} #Shorts`
- Categoria: Esportes (ID 17)

---

## ⚠️ Pontos de Atenção

**Cotas da API do YouTube**
O upload de vídeos consome muitas unidades de cota (padrão: 10.000/dia). Cada upload custa ~1.600 unidades. Monitore o uso no Google Cloud Console para evitar bloqueios durante jogos.

**Token OAuth**
O arquivo `token.json` é gerado automaticamente na primeira autenticação e reutilizado nas execuções seguintes. Se o token expirar, delete o arquivo e o sistema solicitará nova autenticação.

**Câmera em uso**
O `vfwcap` pode falhar silenciosamente se outra aplicação (ex: Teams, OBS, navegador) estiver usando a câmera. Feche outros apps antes de iniciar o sistema.

**Segmento incompleto**
O sistema sempre ignora o segmento mais recente ao gerar o replay, pois ele pode estar sendo escrito pelo FFmpeg no momento do acionamento.

**Conflito de câmera entre buffer e live**
O sistema pausa o buffer automaticamente ao iniciar a live e o retoma ao encerrar. Nunca inicie a live com o buffer ativo manualmente via terminal — use sempre o painel ou as rotas da API.

---

## 🗺️ Roadmap

- [ ] Suporte a múltiplas câmeras simultâneas
- [ ] Interface de configuração de rede (Wi-Fi, câmeras IP)
- [ ] Versão embarcada para Mini PC / Raspberry Pi
- [ ] Botões físicos via Arduino Leonardo (HID)
- [ ] Upload para plataformas alternativas (Instagram Reels, TikTok)
- [ ] Painel multi-quadra (uma instância controlando N câmeras)

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js + TypeScript + Express |
| Vídeo | FFmpeg (vfwcap / RTSP) |
| API YouTube | googleapis + google-auth-library |
| Frontend | React + TypeScript + Vite |
| Estilo | CSS-in-JS (inline `<style>`) + Syne + Familjen Grotesk |

---

## 📄 Licença

MIT
