# 🏢 Guia de Operação — Momentum em Clientes Reais

> Este documento descreve como o sistema Momentum funciona quando instalado em uma **quadra de cliente final**. Abrange desde o primeiro contato até o suporte contínuo.

---

## 📋 Premissas

- Cada instância do Momentum controla **uma quadra** por vez.
- O cliente não precisa ser técnico — a operação deve ser **plug-and-play** após a instalação.
- O sistema depende de uma **conta Google/YouTube do cliente** (ou de uma conta gerenciada por nós).
- O hardware fica instalado fisicamente na quadra (mini PC + câmera + botão).

---

## 🚀 Fases do Ciclo de Vida do Cliente

### 1. Pré-venda e levantamento

Antes de fechar o contrato, verifique:

| Item | O que perguntar/verificar |
|------|------------------------|
| **Internet na quadra** | Existe WiFi? Se não, qual a cobertura 4G das operadoras no local? Fazer speedtest de upload (precisa de 3–5 Mbps estáveis). |
| **Energia** | Existe tomada próxima ao ponto de instalação? Mini PC + câmera + roteador consomem ~30W em total. |
| **Canal no YouTube** | O cliente já tem canal habilitado para transmissões ao vivo? (pode levar até 24h para ativar em youtube.com/features) |
| **Google Cloud** | O cliente tem projeto no Google Cloud com YouTube Data API v3 e YouTube Live Streaming API ativadas? |
| **Público-alvo** | Quantas pessoas assistem? Isso influencia a necessidade de live vs. só replays. |

> ⚠️ **Bloqueador comum:** clientes sem canal no YouTube ou sem habilitação de live. Antecipe isso na proposta.

---

### 2. Onboarding técnico — Credenciais OAuth2

Este é o ponto mais crítico e delicado da instalação. O Momentum precisa de acesso à API do YouTube do cliente.

#### Opção A: Cliente fornece as credenciais (recomendado para SaaS/assinatura)

1. **Criar projeto no Google Cloud** (ou usar um projeto criado pelo cliente):
   - Ativar **YouTube Data API v3**
   - Ativar **YouTube Live Streaming API**
2. **Criar credencial OAuth 2.0** do tipo "Aplicativo para computador" (Desktop app)
3. **Baixar `credentials.json`** e colocar na pasta `backend/` do mini PC
4. **Adicionar o e-mail do canal** como "usuário de teste" na Tela de Consentimento OAuth (se o app não estiver em produção)
5. **Primeira autenticação:**
   - Rodar o backend no mini PC (`npx ts-node src/index.ts`)
   - O sistema abrirá o navegador automaticamente (`start` no Windows)
   - O cliente faz login com a conta Google do canal e autoriza
   - O arquivo `token.json` é gerado automaticamente na pasta `backend/`

> 🚨 **Problema conhecido (headless):** se o mini PC não tiver monitor (instalação típica), o comando `start` falha silenciosamente e o sistema trava.
> **Solução alternativa:** autenticar uma vez em um notebook com tela, copiar o `token.json` gerado para o mini PC via pendrive/SSH, e depois rodar o backend. O `token.json` é reusado nas próximas execuções.

#### Opção B: Nós gerenciamos o canal do cliente (recomendado para serviço full)

- Criamos uma **conta Google dedicada** para o cliente (ex: `momentum.quadra123@gmail.com`)
- Criamos o canal no YouTube nessa conta
- Gerenciamos o projeto no Google Cloud e as credenciais
- O cliente não precisa entender OAuth — só nos dá acesso
- **Risco:** somos responsáveis pela cota de upload do YouTube (10.000 unidades/dia; cada upload custa ~1.600 unidades)

---

### 3. Instalação física

#### Equipamentos no local

| Equipamento | Local sugerido | Observação |
|-------------|-----------------|------------|
| **Mini PC N100** | Dentro de um **rack/caixa estanca** na parede ou embaixo de um banco | Proteger de poeira, bola, e chuva (se quadra semi-aberta). Fanless ajuda. |
| **Câmera IP** | Ponto alto na lateral da quadra, mirando para o centro | Altura mínima 3m para não ser atingida por bola. Evitar luz solar direta na lente (causa overexposure). |
| **Botão Replay** | Parede próxima à mesa do árbito/placar, ou em um pedestal perto da linha de fundo | Altura de 1m para fácil acesso. Fixar bem para não tombar. |
| **Roteador 4G / Modem** | Próximo ao mini PC, mas em posição que pegue sinal | Se usar MiFi, deixar na altura do peito, não no chão. |
| **Injetor PoE** | Junto com o mini PC, dentro da mesma caixa de proteção | Não exposto à intempérie. |

#### Cabeamento

```
Tomada de energia
    └── Injetor PoE (ou Switch PoE)
            ├── Câmera IP ~~~~~~~~~~~~~ cabo Ethernet (PoE) ~~~~~~~~~~~~~~~
            └── Mini PC N100 ~~~~~~~~~~~ cabo Ethernet (dados) ~~~~~~~~~~~~~
                    ├── USB: Botão Arcade (Zero Delay)
                    └── USB/WiFi: Roteador 4G (se não for via Ethernet)
```

> **Comprimento de cabo:** meça a distância câmera → mini PC antes de comprar o cabo Ethernet. O PoE 802.3af suporta até 100m, mas na prática use no máximo 50m para garantir estabilidade.

---

### 4. Configuração inicial no local

#### Passo a passo do técnico de instalação

1. **Montar hardware** e ligar energia
2. **Conectar monitor + teclado + mouse** no mini PC (só para setup inicial)
3. **Copiar `credentials.json` e `token.json`** para `backend/`
4. **Ajustar `backend/src/config.ts`**:
   - Número da quadra (`webcamName` ou novo campo de configuração)
   - RTSP URL da câmera (verificar no app/datasheet da Intelbras; tipicamente `rtsp://admin:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0`)
5. **Testar FFmpeg** manualmente:
   ```bash
   ffmpeg -rtsp_transport tcp -i rtsp://... -t 10 teste.mp4
   ```
   Se gravar um vídeo de 10s sem erros, a câmera está OK.
6. **Subir backend:** `npx ts-node src/index.ts`
7. **Abrir painel** no navegador (`http://localhost:5173` ou IP do mini PC na rede local)
8. **Clicar em "Iniciar Captura"** e verificar se o buffer grava segmentos em `backend/temp/buffer/`
9. **Gerar 1 replay de teste** e confirmar upload no YouTube
10. **Iniciar 1 live de teste** (1 minuto) e confirmar no YouTube Studio
11. **Desconectar monitor** — o sistema deve continuar rodando headless

---

### 5. Operação diária pelo cliente

Após a instalação, o cliente interage apenas com:

- **Painel web** (acessível por tablet/celular na rede local do mini PC)
- **Botão físico** "Replay" na parede

#### Fluxo típico de um dia de jogo

```
Chegada na quadra
    └── Técnico/organizador liga o mini PC (se não estiver em auto-ligamento)
            └── Abre o painel no celular/tablet
                    └── Clica "Iniciar Captura" (buffer começa)
                            └── Espera 30s (buffer enche)
                                    └── Jogo começa
                                            └── Quer replay? Clica "Gerar Replay" ou aperta botão físico
                                            └── Quer live? Clica "Iniciar Live"
                                                    └── Ao terminar, clica "Encerrar Live" (buffer retoma sozinho)
```

> **O cliente NUNCA precisa:** abrir terminal, editar código, ou entender OAuth. Tudo é via UI web.

---

### 6. Suporte e troubleshooting

#### Problemas comuns e diagnóstico

| Sintoma | Causa provável | Solução rápida |
|---------|---------------|----------------|
| Painel mostra "OFFLINE" | Mini PC desligou ou perdeu rede | Verificar LED do mini PC; reiniciar. Se 4G, verificar sinal. |
| Buffer não inicia | Câmera IP desconectou ou FFmpeg travou | Verificar LEDs da câmera; pingar IP da câmera; reiniciar backend. |
| Replay gera mas não sobe no YouTube | Cota da API esgotada ou token expirado | Verificar logs do backend; se token expirado, apagar `token.json` e reautenticar. |
| Live cai do nada | Upload de internet instável | Fazer speedtest; reduzir bitrate da live no `config.ts`; trocar de operadora 4G. |
| Replays sem som | Câmera não tem microfone e código ainda usa `anullsrc` | Trocar para câmera com microfone (VIP 1230 B G5) ou adicionar microfone USB. |
| Botão físico não funciona | Placa zero delay desconectada ou mapeamento de tecla mudou | Verificar se o botão acende LED ao apertar; reconectar USB; verificar se o backend loga "Tecla R pressionada". |
| YouTube não aceita live | Canal não habilitado para transmissão ao vivo | Cliente precisa acessar youtube.com/features e ativar (pode levar 24h). |

#### Logs e diagnóstico remoto

O backend loga tudo no console. Para suporte remoto:

- **Opção 1 (rede local):** acessar `http://ip-do-mini-pc:3001` via VPN ou TeamViewer/AnyDesk instalado no mini PC
- **Opção 2 (sem acesso remoto):** instalar um serviço de log remoto (ex: enviar logs para um servidor central via HTTP POST) — **não implementado ainda**
- **Opção 3 (presencial):** técnico vai ao local com monitor + teclado, abre terminal e roda `npx ts-node src/index.ts` para ver os logs ao vivo

> 🔧 **Sugestão de melhoria futura:** endpoint `/api/logs` que retorna as últimas N linhas de log, acessível pelo painel frontend. Facilita suporte sem SSH.

---

### 7. Manutenção preventiva

| Periodicidade | Ação |
|---------------|------|
| **Semanal** | Verificar pelo painel web se o buffer está ativo; gerar 1 replay de teste. |
| **Mensal** | Limpar lente da câmera; verificar se cabos não foram danificados por bola/vento. |
| **Trimestral** | Verificar uso de cota da API YouTube; verificar se `token.json` ainda é válido. |
| **Anual** | Revisar hardware: SSD com espaço? Mini PC com poeira interna? Atualizar Node.js/dependências. |

---

## 💼 Modelos de comercialização (sugestão)

### Modelo A: Venda do equipamento + instalação

- Cliente **compra** o kit de hardware (mini PC + câmera + botão + infra)
- Pagamos/nós instalamos e configuramos (mão de obra inclusa ou à parte)
- Suporte por 3 meses incluso; depois contrato de manutenção anual
- **Vantagem:** receita imediata; cliente é dono do equipamento.
- **Desvantagem:** cliente precisa gerenciar OAuth/canal YouTube sozinho depois.

### Modelo B: Assinatura SaaS (aluguel do sistema)

- Nós **alugamos** o hardware para o cliente (ou deixamos em comodato)
- Cliente paga **mensalidade** que inclui:
  - Uso do software
  - Manutenção do hardware
  - Gerenciamento do canal YouTube (se usarmos nossa conta)
  - Suporte técnico
- **Vantagem:** receita recorrente; cliente não precisa entender tecnologia; nós controlamos a conta Google.
- **Desvantagem:** capital preso em hardware; responsabilidade pela cota YouTube.

### Modelo C: Por evento

- Cliente paga **por dia de uso** (ex: campeonato de fim de semana)
- Levamos o equipamento, instalamos, operamos, retiramos
- **Vantagem:** alto valor por evento; não precisa de instalação permanente.
- **Desvantagem:** logística intensiva; não escala para "todas as quadras do bairro".

---

## 🗺️ Roadmap de operação futuro

- [ ] **Painel de status remoto** — uma página web centralizada que mostra o status de todas as quadras instaladas (online/offline, buffer ativo, último replay)
- [ ] **Alertas automáticos** — notificação (WhatsApp/e-mail) quando uma quadra fica offline ou a câmera para de responder
- [ ] **Multi-quadra** — uma instância do backend controlar N câmeras (reduz custo de hardware por quadra)
- [ ] **App móvel para espectadores** — separar do YouTube; app próprio para ver replays ao vivo (menos dependência da API Google)
- [ ] **Autenticação headless automatizada** — script que gera URL de auth e exibe no painel web; operador autentica pelo celular sem abrir navegador no mini PC
