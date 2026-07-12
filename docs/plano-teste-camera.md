# Plano de Teste — Câmera IP Intelbras

## Objetivo

Substituir a webcam do notebook pela câmera IP Intelbras já instalada em quadra, mantendo os fluxos de **buffer**, **replay** e **live** funcionais.

---

## Situação atual

- O código usa `vfwcap -i 0` (captura de webcam no Windows) em dois arquivos:
  - `backend/src/buffer.ts`
  - `backend/src/index.ts` (transmissão live)
- Outra pessoa do projeto já conseguiu "acessar a câmera", mas ainda não sabemos se foi via **RTSP** ou via software proprietário da Intelbras.

---

## Arquitetura confirmada no local (visita de 11/07)

Após visita presencial, foi possível confirmar a topologia real da instalação. **A câmera IP não está conectada a um DVR.** O vídeo chega ao computador via rede local por um **switch PoE**.

```
┌─────────────┐   cabo PoE/Ethernet   ┌──────────────┐   cabo de rede   ┌────────────┐
│  Câmera IP  │◄─────────────────────►│  Switch PoE  │◄─────────────────►│  Roteador  │
└─────────────┘                       └──────────────┘                  └─────┬──────┘
                                                                           │
                            ┌──────────────────────────────────────────────┘
                            │
                            │ cabo de rede                    ┌──────┐ USB
                            ▼                                 │      │◄──── Botoeira/placa
                    ┌──────────────────┐                      │ RPi  │      Zero Delay
                    │   Notebook de    │                      │(positivo)│
                    │     teste        │                      └──────┘
                    └──────────────────┘
```

### Dispositivos identificados nas fotos

| Item | Descrição | Função no sistema |
|---|---|---|
| **Câmera IP** | Câmera dome/bullet externa em suporte metálico | Fonte de vídeo RTSP |
| **Switch PoE** | Switch pequeno, cor cinza/marrom | Alimenta a câmera e distribui rede |
| **Roteador** | Recebe link de internet e distribui rede local | Conecta RPi, switch PoE e internet |
| **Raspberry Pi** | Computador pequeno na frente do rack | Equivalente ao mini PC do Momentum |
| **Placa de botoeiras** | Placa verde com conectores no fundo do rack | Interface física dos botões |
| **Botoeira** | Botões arcade conectados via cabo de impressora USB | Dispara replay/live (USB HID) |

### O que isso significa para o teste

- **Não precisamos de DVR.** O stream RTSP vem direto da câmera IP.
- **Não precisamos do parâmetro `channel`**, típico de DVRs/NVRs.
- A arquitetura é **muito próxima do modelo Momentum** (computador embarcado + câmera IP PoE + botoeira USB HID + roteador).
- O Raspberry Pi deles valida que um hardware pequeno/sem ventoinha consegue processar a câmera, mas provavelmente não com buffer + live simultâneos — isso ainda precisa ser testado no notebook primeiro.

---

## Informações que ainda precisamos obter

Antes de alterar o código, confirme com quem acessou a câmera:

| # | Pergunta | Exemplo de resposta |
|---|---|---|
| 1 | Qual o **modelo exato da câmera IP**? | VIP 1230 B G5, VIPC 1230 B G2, VIP 3230 IK, etc. |
| 2 | Qual o **IP fixo da câmera** na rede local? | `192.168.1.100` |
| 3 | Qual o **usuário e senha** redefinidos recentemente? | `admin`, `Senha123` |
| 4 | A URL RTSP **direta da câmera** abre no VLC/`ffplay`? | `rtsp://admin:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0` |
| 5 | Qual a **resolução do stream** da câmera? | 1920×1080, 1280×720, 640×480... |
| 6 | O stream tem **faixa de áudio**? | Sim/Não (verificar via `ffprobe`) |
| 7 | Qual **software usou** para testar o acesso? | App Intelbras, VLC, `ffplay`, navegador... |
| 8 | O notebook será conectado por **cabo** ou **Wi-Fi** no dia do teste? | Cabo no roteador / Wi-Fi da rede local |
| 9 | O **roteador** fornece DHCP ou os IPs são fixos? | IP da câmera é fixo ou reservado? |

> **Importante:** só podemos confirar que a câmera funciona no FFmpeg se a URL abrir no **VLC** ou no comando `ffplay`. O app da Intelbras pode usar protocolo próprio e dar falsa sensação de que tudo está pronto.

---

## URLs RTSP comuns para câmeras Intelbras

Sem DVR, a URL pode ser a mesma padrão Intelbras/ONVIF:

```
rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/cam/realmonitor?channel=1&subtype=0
```

| Parâmetro | Significado |
|---|---|
| `channel=1` | Canal da câmera (em câmeras IP isoladas geralmente é `1`) |
| `subtype=0` | Stream principal — alta resolução (geralmente 1080p ou 720p) |
| `subtype=1` | Stream extra — baixa resolução, menor uso de banda |

Para teste com rede local boa, use `subtype=0`. Se o uplink for fraco (ex: 4G), teste `subtype=1`.

Outros formatos possíveis para câmeras Intelbras:

```
rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/user=USUARIO_password=SENHA_channel=1_stream=0.sdp
rtsp://USUARIO:SENHA@IP_DA_CAMERA:554/live/ch00_0
```

> ⚠️ **Se nenhuma URL funcionar**, confirme o **modelo exato** da câmera no corpo do equipamento ou no app de configuração.

---

## Validação antes de alterar o código

No notebook, no local do teste, rode:

```bash
ffplay -rtsp_transport tcp rtsp://USUARIO:SENHA@IP:554/URL_DA_CAMERA
```

Se aparecer imagem, a URL está correta. Se der erro:

| Erro | Provável causa |
|---|---|
| `Unauthorized` | Usuário ou senha errados |
| `Connection refused` | Porta errada ou RTSP desabilitado |
| `No route to host` / timeout | Notebook não está na mesma rede da câmera |
| `Invalid data found` | URL RTSP mal formada |

Também teste o ping:

```bash
ping IP_DA_CAMERA
```

E verifique se há áudio no stream:

```bash
ffprobe -v error -show_entries stream=codec_type -of json rtsp://USUARIO:SENHA@IP:554/URL_DA_CAMERA
```

---

## Ajustes de código (já iniciados)

Depois que a URL RTSP estiver validada, edite os `TODO(camera)` nos arquivos:

### `backend/src/buffer.ts`

- Substituir a URL RTSP pelo valor real.
- Ajustar o `crop` conforme a resolução da câmera.
- Se a câmera tiver áudio, remover a flag de vídeo-only e capturar ambas as faixas.

### `backend/src/index.ts`

- Substituir a URL RTSP pelo valor real.
- Ajustar o `crop` da live conforme a resolução.
- Se a câmera tiver áudio no RTSP, **remover o `anullsrc`** e deixar o FFmpeg capturar o áudio real.

---

## Ajustes finos que só dá para fazer no local

### 1. Crop / enquadramento

A webcam era 4:3. A câmera provavelmente é **16:9 (1920×1080)**.

- **Replay (Shorts 9:16):** extrair uma faixa vertical do centro.
  - Exemplo inicial para 1920×1080: `crop=607:1080:657:0,scale=360:640`
  - Exemplo inicial para 1280×720: `crop=405:720:438:0,scale=360:640`
- **Live (4:3):** extrair uma faixa 4:3 do centro.
  - Exemplo inicial para 1920×1080: `crop=1440:1080:240:0,scale=640:480,fps=30`
  - Exemplo inicial para 1280×720: `crop=960:720:160:0,scale=640:480,fps=30`

> Esses números provavelmente vão precisar de ajuste olhando a imagem real.

### 2. Áudio

A câmera na foto parece ser um modelo **sem áudio visível**. Para o teste:

- Se `ffprobe` não mostrar faixa de áudio: manter `anullsrc` na live e replays sem som.
- Se a câmera tiver microfone embutido: remover `anullsrc` e deixar o FFmpeg capturar a faixa de áudio do RTSP.

### 3. Rede

Certifique-se de que:

- O notebook está na **mesma rede local** da câmera.
- O IP da câmera é **fixo** ou reservado no DHCP.
- Não há firewall bloqueando a porta RTSP (padrão: 554).
- O cabo de rede entre notebook e roteador/switch está funcionando (levar cabo de reserva).

---

## Roteiro do teste

1. Chegar no local com o notebook e um cabo de rede de reserva.
2. Conectar o notebook na rede do roteador (cabo preferencialmente).
3. Testar `ping` e `ffplay` com a URL RTSP.
4. Verificar se há áudio no stream via `ffprobe`.
5. Ajustar URL e crop nos arquivos `buffer.ts` e `index.ts`.
6. Subir backend (`npx ts-node src/index.ts`) e frontend (`npm run dev`).
7. Clicar em **Iniciar Captura** e verificar se o buffer gera segmentos em `backend/temp/buffer/`.
8. Aguardar 30–40 segundos e clicar em **Gerar Replay**.
9. Verificar se o replay foi salvo em `backend/temp/outputs/`.
10. Testar **Iniciar Live** e confirmar no YouTube Studio se o sinal chega.
11. Encerrar a live e confirmar que o buffer retoma sozinho.

---

## Problemas esperados

| Problema | Solução provável |
|---|---|
| FFmpeg não conecta na câmera | URL RTSP, usuário, senha ou porta errados |
| Imagem aparece mas buffer não gera segmentos | Resolução/crop incompatível com a câmera |
| Live cai depois de alguns segundos | Rede instável ou bitrate muito alto para o uplink |
| Replay fica torto/cortado | Ajustar valores do crop |
| YouTube não recebe sinal | Verificar OAuth/token; confirmar que live foi criada na API |

---

## Próximos passos depois do teste

- Gravar a URL RTSP final e os valores de crop que funcionaram.
- Decidir se investimos em áudio ambiente (microfone externo ou câmera com áudio).
- Implementar health check do FFmpeg para retomar automaticamente se a câmera cair.
- Planejar migração do notebook para o mini PC de campo.
- Atualizar `docs/DUVIDAS.md` e `docs/OPERACAO.md` se a arquitetura final for diferente do previsto.
