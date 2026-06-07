# Momentum — Painel Operacional

Stack real, estrutura, estado, armadilhas, roadmap. Leia em 2 minutos.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend runtime | Node.js + TypeScript (CommonJS, `ts-node`) |
| Backend framework | Express 5 + CORS |
| Vídeo | FFmpeg (vfwcap/Windows; RTSP para câmera IP em teste) |
| YouTube API | `googleapis` + `google-auth-library` (OAuth2) |
| Frontend | React 19 + TypeScript + Vite 8 |
| CSS | `App.css` + `index.css` — Tailwind 4 **instalado mas morto** |
| Ícones | Lucide React |
| Fonte | Inter 400/500/600/700 (Google Fonts, preconnect) |
| Comunicação | REST polling a cada 2s |

## Estrutura de Pastas

```
momentum/
├── backend/
│   ├── src/
│   │   ├── index.ts      # Express + rotas + máquina de estados buffer/live/upload
│   │   ├── buffer.ts     # FFmpeg → segmentos de 5s; guard clause; SIGKILL fallback
│   │   ├── replay.ts     # concat + corte 30s
│   │   ├── youtube.ts    # OAuth2 + upload/live; timeout + retry nas APIs
│   │   └── config.ts     # configurações hardcoded
│   ├── temp/buffer/      # segmentos temporários (gitignored)
│   ├── temp/outputs/     # replays gerados (gitignored)
│   ├── credentials.json  # OAuth Google (gitignored)
│   └── token.json        # token salvo após 1ª auth (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # orquestrador; estado + polling + callbacks
│   │   ├── App.css          # estilos dos componentes (~550 linhas)
│   │   ├── index.css        # variáveis CSS globais + reduced-motion
│   │   ├── types.ts         # Status, LogEntry
│   │   ├── main.tsx         # createRoot + StrictMode
│   │   ├── vite.config.ts   # proxy /api → localhost:3001
│   │   ├── index.html       # Momentum, lang=pt-BR, Inter preconnect
│   │   └── components/
│   │       ├── Sidebar.tsx    # config quadra, status pills, upload pill
│   │       ├── Topbar.tsx     # hamburger, título, chip live/offline
│   │       └── Dashboard.tsx  # cards de ação, replay banner, log
│   └── public/
│       └── favicon.svg      # ícone Momentum (círculo dourado + seta)
├── CLAUDE.md
├── README.md              # documentação principal em pt-BR
└── .gitignore
```

## Convenções

- **Português no código**: variáveis, funções, logs, rotas. Exceção: APIs Google em inglês.
- **Estado global em variáveis de módulo** (`index.ts`): `let liveAtiva`, `let broadcastIdAtual`. Não usa classe nem store.
- **Sem testes**: `npm test` é `echo Error`. Decisão ativa: testes unitários teriam baixo ROI porque 90% do código é orquestração de I/O externo (FFmpeg spawn, APIs Google, fs). E2E seria mais valioso, mas requer hardware real.
- **Sem linter/formatador** no backend.

## Estado Atual

| O que | Status |
|---|---|
| Backend roda | `npx ts-node src/index.ts` na 3001 |
| Frontend roda | `npm run dev` na 5173 com proxy para API |
| Autenticação OAuth | Manual 1ª vez, salva `token.json`. Abre navegador automaticamente no Windows (`start`). Mini PC headless = problema. |
| Buffer | Segmentação FFmpeg funcional. Guard clause evita duplo spawn. SIGKILL após 3s se SIGTERM falhar. |
| Replay | Concatenação + upload YouTube Shorts funcional. Upload fire-and-forget: responde HTTP imediatamente, processa em background. |
| Live | Cria broadcast dinâmico + RTMP + transmissão FFmpeg funcional. Retoma buffer automaticamente em qualquer falha. |
| Offline detection | Frontend detecta servidor offline em ≤6s (3 polls × 2s). Cards desabilitados. Chip OFFLINE na topbar. |
| Multi-quadra | Parcial — apenas uma quadra por instância, número configurável via UI. |

## Armadilhas Conhecidas

1. **Stream key hardcoded em `config.ts`** — `k94z-...` exposta no código. Não é usada no fluxo live atual (RTMP dinâmico da API), mas está lá.
2. **OAuth callback na porta 3000** — hardcoded. Mini PC headless = impossível abrir navegador. Precisa de fluxo headless (URL exibida no log + celular/tablet para autenticar).
3. **Tailwind instalado sem uso** — build time desperdiçado. Remover requer ajuste no `vite.config.ts`.
4. **`vfwcap` só funciona no Windows** — briefing menciona câmera IP (RTSP). Código ainda usa `vfwcap -i 0`. Mudança obrigatória antes de qualquer teste com hardware real.
5. **Áudio sintético (`anullsrc`) na live** — briefing pede "áudio ambiente integrado". YouTube aceita anullsrc, mas experiência é ruim.
6. **Sem áudio nos replays** — `ffmpeg concat -c copy` não adiciona faixa de áudio. Replays saem sem som.
7. **Resolução de live (640×480) ≠ resolução de replay (360×640)** — live é landscape 4:3, replay é portrait 9:16. YouTube Shorts exige 9:16; live aceita 4:3. Isso é intencional mas confuso.
8. **Upload de replay não tem fila** — 3 cliques seguidos = 3 uploads paralelos disputando banda e cotas API. Backend retorna 429 se `uploadEmAndamento = true`, mas isso é racy (check-then-act).
9. **Mini PC headless + OAuth** — o `exec('start ...')` no `youtube.ts` abre navegador no Windows desktop. Sem monitor = deadlock. A autenticação precisa ser feita uma vez em máquina com tela, depois o `token.json` é copiado para o mini PC.
10. **Sem monitoramento de saúde do FFmpeg** — se câmera desconectar, buffer morre e não retoma sozinho. Operador só descobre ao tentar replay.

## Próximos Passos (priorizado)

### 1. Preparação para Teste ao Vivo (obrigatório antes de comprar)
→ Mude `buffer.ts` e `index.ts` de `vfwcap` para RTSP (câmera IP)
→ Teste com notebook + celular como hotspot + câmera IP emprestada/alugada
→ Valide se N100 aguenta buffer + live simultâneos (QuickSync)

### 2. Setup de Hardware
→ Comprar: mini PC N100, câmera IP PoE, botão arcade + placa Zero Delay, roteador 4G
→ Montar em quadra real com jogadores de verdade
→ Capturar métricas: tempo buffer → replay, tempo live start, uptime total

### 3. Pós-teste — Correções Críticas
→ OAuth headless (autenticar uma vez, copiar token.json)
→ Áudio ambiente nos replays (microfone USB ou câmera IP com áudio RTSP)
→ Health check do FFmpeg (retoma automático se morrer)
→ Fila de uploads (evita paralelismo)

### 4. Roadmap Técnico Futuro
→ Ad-insertion nos replays (logos de patrocinador via FFmpeg overlay)
→ Multi-streaming (YouTube + Instagram simultâneo via FFmpeg tee)
→ Placar overlay na live (filtro drawtext do FFmpeg)
→ App móvel para download dos replays (separação do YouTube)

## Notas de Decisão

- **Testes unitários descartados** — ROI baixo para código de orquestração. E2E com hardware real é o próximo passo de validação.
- **Monolito frontend mantido** — 3 componentes extraídos mas ainda em 1 nível. Sem necessidade de router/navegação.
- **Inter escolhida sobre Syne** — legibilidade em dashboard operacional > identidade visual forte. Contexto esportivo já é transmitido pela paleta.
- **Upload fire-and-forget** — decisão para não bloquear HTTP. Upload demora 10-30s; operador não deve esperar.
