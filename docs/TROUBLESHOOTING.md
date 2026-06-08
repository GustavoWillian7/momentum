# 🔧 Cartilha de Diagnóstico — Técnico de Campo

> Imprima este documento e leve na instalação. Formato rápido: sintoma → causa → solução.

---

## Antes de sair da base

- [ ] `credentials.json` copiado para `backend/`
- [ ] `token.json` gerado (autenticado uma vez no notebook, copiado para pendrive)
- [ ] `buffer.ts` configurado com RTSP URL correto da câmera
- [ ] Cabo de rede medido e crimpado (comprimento câmera → mini PC)
- [ ] Mini PC com Windows atualizado; Node.js, FFmpeg e dependências instaladas
- [ ] Aplicativo da câmera Intelbras no celular (para descobrir IP e testar RTSP)

---

## Diagnóstico por sintoma

### ❌ Painel mostra "OFFLINE" (chip vermelho na topbar)

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| Mini PC ligado? | LED de energia aceso? | → Próxima | Liga na tomada; verificar cabo de força |
| Rede local funciona? | `ping 8.8.8.8` no mini PC | → Próxima | Verificar roteador 4G / cabo Ethernet / WiFi |
| Backend rodando? | Terminal mostra "Servidor na porta 3001"? | → Próxima | Subir backend: `npx ts-node src/index.ts` |
| Frontend consegue pingar API? | No navegador, abrir `http://ip-do-mini-pc:3001/api/status` | → Verificar CORS/proxy | Verificar firewall do Windows / IP correto |

> **Dica rápida:** se o frontend acessa por `localhost` mas não pelo IP da rede, o proxy do Vite não está configurado para IP remoto. Acesse pelo IP direto: `http://ip:3001`.

---

### ❌ Buffer não inicia (clica "Iniciar Captura", nada acontece)

| Verificar | Comando / Como | Se estiver OK | Se estiver ruim |
|-----------|----------------|---------------|-----------------|
| FFmpeg no PATH? | `ffmpeg -version` no terminal | → Próxima | Reinstalar FFmpeg; adicionar ao PATH |
| Câmera responde ao ping? | `ping 192.168.1.100` (IP da câmera) | → Próxima | Verificar cabo PoE / injetor ligado / IP correto |
| RTSP URL está certo? | `ffprobe -rtsp_transport tcp -i rtsp://...` | → Próxima | Corrigir usuário/senha/IP/stream path no `buffer.ts` |
| FFmpeg consegue gravar? | `ffmpeg -rtsp_transport tcp -i rtsp://... -t 5 teste.mp4` | → Próxima | Verificar codec da câmera; testar `subtype=1` (sub-stream) |
| Já existe buffer rodando? | Task Manager → procurar `ffmpeg.exe` | → Próxima | Matar processo FFmpeg antigo; guard clause pode estar travada |
| Pasta `temp/buffer/` existe? | Verificar `backend/temp/buffer/` | → Próxima | Criar pasta manualmente ou rodar `mkdir` no backend |

> **Causa mais comum:** IP da câmera mudou (DHCP). Use IP fixo na câmera ou reserve no roteador.

---

### ❌ Replay gera mas não sobe no YouTube

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| Arquivo de replay existe? | `dir backend\temp\outputs\` | → Próxima | Verificar `replay.ts`; verificar se FFmpeg concat funcionou |
| Tamanho do replay > 0 bytes? | Propriedades do arquivo | → Próxima | Replay falhou no concat; verificar logs do backend |
| `token.json` existe e é válido? | Abrir no VS Code; campo `expiry_date` no futuro? | → Próxima | Apagar `token.json`; reautenticar no notebook; copiar de novo |
| Cota da API esgotada? | Google Cloud Console → APIs → Quotas | → Próxima | Aguardar reset diário (meia-noite PT) ou solicitar aumento |
| Canal do YouTube validado? | youtube.com/features → transmissões ao vivo ativadas? | → Próxima | Cliente precisa ativar; pode levar 24h |
| Upload em andamento travado? | `uploadEmAndamento = true` no código / logs | → Aguardar ou reiniciar | Reiniciar backend; próximo upload será enfileirado corretamente |

> **Dica rápida:** cada upload custa ~1.600 unidades de cota. Com 10.000/dia, o limite é ~6 replays por dia. Monitore no Google Cloud Console.

---

### ❌ Live cai do nada ou não sobe

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| Upload de internet estável? | speedtest.net no mini PC | → Próxima | Reduzir bitrate no `config.ts`; trocar operadora 4G; usar cabo em vez de WiFi |
| Broadcast foi criado na API? | Log do backend mostra `broadcastId`? | → Próxima | Verificar `token.json`; verificar se canal tem live habilitada |
| Stream key / RTMP URL corretos? | Log do backend mostra URL RTMP completa? | → Próxima | Verificar `youtube.ts`; API do YouTube pode ter retornado URL diferente |
| FFmpeg da live está rodando? | Task Manager → `ffmpeg.exe` (2º instância) | → Próxima | Verificar logs do FFmpeg (erro de codec, resolução, etc.) |
| Câmera não foi liberada do buffer? | Logs mostram "Buffer encerrado" antes da live? | → Próxima | Guard clause pode ter falhado; matar ffmpeg do buffer manualmente |

> **Causa mais comum:** upload de internet oscila. YouTube dropa o stream se perde pacotes por mais de alguns segundos. Para teste, use bitrate mais baixo (ex: 1.000k em vez de 2.500k).

---

### ❌ Replays saem sem som

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| Câmera tem microfone? | Datasheet / app Intelbras mostra ícone de áudio? | → Próxima | Comprar câmera com microfone (VIP 1230 B G5) ou microfone USB |
| Stream RTSP tem faixa de áudio? | `ffprobe rtsp://...` — aparece `Stream #0:1`? | → Próxima | Habilitar áudio na câmera via app/web; verificar se porta de áudio está bloqueada |
| Replay preserva áudio no concat? | `ffmpeg concat` está usando `-c copy` ou re-encoding? | → Próxima | Mudar para re-encoding com áudio: `-c:v libx264 -c:a aac` |
| Live também está sem som? | Ouvir live no YouTube | → Próxima | O `anullsrc` pode estar ativo; substituir por áudio real da câmera |

> **Nota técnica:** o `concat -c copy` do `replay.ts` preserva o que está nos segmentos. Se os segmentos do buffer não têm áudio, o replay também não terá. A solução definitiva é capturar áudio junto com o vídeo no `buffer.ts`.

---

### ❌ Botão físico "Replay" não funciona

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| LED do botão acende ao apertar? | Olhar visualmente | → Próxima | Verificar fiação do botão na placa zero delay |
| Placa zero delay é reconhecida pelo Windows? | `Painel de Controle → Dispositivos` — aparece como teclado/joystick? | → Próxima | Reinstalar drivers; trocar porta USB; testar em outro PC |
| Backend detecta a tecla? | Logs mostram "Tecla R pressionada" ou similar? | → Próxima | Verificar se a placa está mapeando a tecla corretamente; usar app de teste de joystick |
| A tecla está no foco correto? | Backend escuta `stdin` (terminal) ou evento global? | → Próxima | Se escuta só terminal, não funciona quando terminal não está focado. Solução: usar biblioteca de input global (ex: `node-global-key-listener`) |

> **Dica rápida:** aperte o botão e abra o Bloco de Notas no Windows. Se aparecer a letra "R", a placa zero delay está funcionando como teclado.

---

### ❌ OAuth trava na primeira autenticação

| Verificar | Como | Se estiver OK | Se estiver ruim |
|-----------|------|---------------|-----------------|
| Navegador abriu? | `start` executou no Windows? | → Próxima | Mini PC sem monitor = `start` falha. Usar solução headless. |
| Porta 3000 está livre? | `netstat -ano \| findstr :3000` | → Próxima | Matar processo na porta 3000; mudar porta no `youtube.ts` se necessário |
| Callback chegou ao servidor? | Log do backend mostra "Token recebido"? | → Próxima | Verificar firewall; verificar se URL de callback bate com a autorizada no Google Cloud |
| `credentials.json` é do tipo Desktop? | Abrir JSON; campo `"type": "desktop"`? | → Próxima | Criar nova credencial do tipo "Desktop app" no Google Cloud Console |

> **Solução definitiva para headless:** autenticar uma vez em notebook com tela → gerar `token.json` → copiar para o mini PC via pendrive. O `token.json` dura meses e é reutilizado.

---

## 🛠️ Comandos de emergência (terminal do mini PC)

```bash
# Matar todos os processos FFmpeg (quando travou)
taskkill /F /IM ffmpeg.exe

# Verificar se backend está rodando e em qual porta
netstat -ano | findstr :3001

# Testar RTSP da câmera manualmente
ffmpeg -rtsp_transport tcp -i rtsp://admin:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0 -t 10 teste.mp4

# Verificar áudio no stream RTSP
ffprobe -v error -show_entries stream=codec_type -of json rtsp://admin:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0

# Listar segmentos do buffer
ls backend/temp/buffer/

# Limpar buffer antigo (se necessário)
rm backend/temp/buffer/*.mp4

# Reautenticar OAuth (apagar token e reiniciar)
del backend\token.json
npx ts-node src/index.ts
```

---

## 📞 Escalonamento

Se nada daqui resolver em 30 minutos:

1. **Coletar evidências:**
   - Foto do erro na tela / no painel
   - Últimas 20 linhas do log do backend (copiar do terminal)
   - Resultado do `ffprobe` da câmera
   - Print do speedtest.net
2. **Abrir issue no projeto** com:
   - Sintoma
   - O que já foi tentado (marcar itens desta cartilha)
   - Logs e evidências
3. **Workaround para o evento de hoje:**
   - Se live não sobe → usar celular do organizador para live manual no YouTube
   - Se replay não sobe → salvar replay local em `temp/outputs/` e fazer upload manual depois
   - Se buffer não inicia → gravar com celular na bancada como backup

---

## 📋 Checklist de saída da instalação

Ante de ir embora da quadra, confirme:

- [ ] Buffer inicia e grava segmentos (verificar `temp/buffer/`)
- [ ] Replay gera e sobe no YouTube (testar 1 vez; verificar canal do cliente)
- [ ] Live sobe e fica estável por 2 minutos (verificar no YouTube Studio)
- [ ] Botão físico gera replay (apertar 1 vez; verificar upload)
- [ ] Painel web acessível pelo celular do cliente (mesma rede WiFi)
- [ ] Cliente sabe onde está o botão e como ler o status no painel
- [ ] `token.json` e `credentials.json` estão no lugar; backup em pendrive
- [ ] Senha do WiFi da quadra (se houver) anotada
- [ ] IP fixo da câmera configurado (ou DHCP reservado no roteador)
