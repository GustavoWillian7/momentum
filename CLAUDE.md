# Momentum

Stack real, estrutura, convenções, armadilhas. Leia em 2 minutos.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend runtime | Node.js + TypeScript (CommonJS, `ts-node`) |
| Backend framework | Express 5 + CORS |
| Vídeo | FFmpeg (vfwcap no Windows, RTSP opcional) |
| YouTube API | `googleapis` + `google-auth-library` (OAuth2) |
| Frontend | React 19 + TypeScript + Vite 8 |
| CSS | Inline `<style>` em JSX — Tailwind 4 instalado mas **zero uso** |
| Comunicação | REST polling a cada 2s |

## Estrutura de Pastas

```
momentum/
├── backend/
│   ├── src/
│   │   ├── index.ts      # Express + estado global + rotas + teclado CLI
│   │   ├── buffer.ts     # FFmpeg vfwcap → segmentos de 5s
│   │   ├── replay.ts     # concat + corte 30s
│   │   ├── youtube.ts    # OAuth2 + upload Shorts + live broadcast
│   │   └── config.ts     # configurações hardcoded (inclui stream key exposta)
│   ├── temp/buffer/      # segmentos temporários (gitignored)
│   ├── temp/outputs/     # replays gerados (gitignored)
│   ├── credentials.json  # OAuth Google (gitignored)
│   └── token.json        # token salvo após 1ª auth (gitignored)
├── frontend/
│   ├── src/App.tsx       # componente único monolito (~790 linhas, CSS inline)
│   ├── vite.config.ts    # proxy /api → localhost:3001
│   └── index.html        # título genérico "frontend"
├── README.md             # documentação principal em pt-BR
└── .gitignore            # credenciais + node_modules + temp/
```

## Convenções

- **Português no código**: variáveis, funções, logs, rotas. Exceção: APIs do Google em inglês.
- **Emojis extensivos** em logs do backend.
- **Estado global em variáveis de módulo** (`index.ts`): `let bufferAtivo`, `let liveAtiva`, etc. Não usa classe nem store.
- **Sem testes**: `npm test` no backend é `echo Error`.
- **Sem linter/formatador** no backend.

## Estilo de Resposta Esperado

- Comprimido — sem saudações, sem repetir o pedido.
- Código direto, explicações só se solicitadas.
- Use `→` para causalidade (ex: "buffer ativo → live falha se tentar iniciar").

## Estado Atual

| O que | Status |
|---|---|
| Backend roda | `npx ts-node src/index.ts` na 3001 |
| Frontend roda | `npm run dev` na 5173 com proxy para API |
| Autenticação OAuth | Manual 1ª vez, salva `token.json` |
| Buffer | Segmentação FFmpeg funcional |
| Replay | Concatenação + upload YouTube Shorts funcional |
| Live | Cria broadcast dinâmico + RTMP + transmissão FFmpeg funcional |
| Multi-quadra | Parcial — apenas uma quadra por instância, número configurável via UI |

## Armadilhas Críticas

1. **Stream key hardcoded em `config.ts`** — `k94z-...` exposta no código. Não é usada no fluxo live atual (que usa RTMP dinâmico da API), mas está lá.
2. **FFmpeg zumbis** — se Node crashar, processos ficam orfãos. Sem cleanup de `SIGTERM`/`SIGINT`.
3. **Live e buffer competem pela mesma câmera** — `index.ts` pausa buffer antes de live, mas falha silenciosa do `vfwcap` em segundo plano é possível.
4. **OAuth callback na porta 3000** — hardcoded, pode conflitar.
5. **Tailwind instalado sem uso** — build time desperdiçado.
6. **`index.html` com título "frontend"** — genérico.
7. **`frontend/README.md` é lixo do template Vite** — deve ser deletado.
8. **Assets fantasmas** — `react.svg`, `vite.svg`, `hero.png` em `src/assets/` não referenciados.
9. **`config.ts` não tipado** — objeto plain JS, alteração manual arriscada.
10. **Sem retry/reconexão** — falhas de rede com YouTube = morte instantânea.
