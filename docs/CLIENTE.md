# 🏖️ Momentum — Guia do Cliente

> Leitura simples, sem termos técnicos. Se você comprou ou alugou o Momentum para sua quadra, este documento explica o que você precisa fazer (e o que não precisa se preocupar).

---

## 🤔 O que é o Momentum?

O **Momentum** é um sistema que fica instalado na sua quadra e faz três coisas automaticamente:

1. **Grava tudo o tempo todo** — mantém um buffer dos últimos ~40 segundos
2. **Gera replays instantâneos** — apertou o botão, os últimos 30 segundos viram um vídeo curto e sobem pro YouTube como **Short**
3. **Transmite ao vivo** — com um clique, sua quadra vai ao vivo no YouTube

Você não precisa de operador técnico. Basta apertar um botão.

---

## ✅ O que você precisa providenciar

Antes da instalação, garanta os itens abaixo. Sem eles, o sistema não funciona.

### 1. Internet na quadra

| O que precisa | Por quê |
|---------------|---------|
| **WiFi próprio** ou **roteador 4G** | O sistema precisa de internet para subir vídeos e fazer live no YouTube |
| **Upload de pelo menos 3 Mbps** | A live do YouTube precisa enviar vídeo em tempo real; se a internet for muito lenta, a transmissão cai |

> 💡 **Como testar:** peça para o técnico fazer um teste de velocidade no dia da visita. Se a internet da quadra não for suficiente, podemos colocar um roteador 4G dedicado (custo à parte).

### 2. Canal no YouTube

| O que precisa | Por quê |
|---------------|---------|
| **Conta Google** (Gmail) | O YouTube é de quem? Sua conta ou do clube? |
| **Canal no YouTube habilitado para transmissões ao vivo** | O YouTube exige ativação manual; pode levar até 24 horas |

> ⚠️ **Importante:** se o canal ainda não está habilitado para live, acesse **youtube.com/features** com sua conta e ative "Transmissões ao vivo" o quanto antes. Se deixar para o dia da instalação, pode não dar tempo.

### 3. Tomada de energia próxima

O sistema usa pouca energia (equivalente a uma lâmpada de LED), mas precisa de **uma tomada 110V/220V** perto do ponto de instalação.

---

## 🚫 O que você NÃO precisa se preocupar

- ❌ Não precisa entender códigos, programação ou computadores
- ❌ Não precisa criar projetos no Google Cloud (a gente cuida disso)
- ❌ Não precisa saber o que é RTSP, FFmpeg ou OAuth
- ❌ Não precisa ficar editando vídeos — o sistema corta e publica sozinho
- ❌ Não precisa de operador técnico no dia do jogo

---

## 🎮 Como usar no dia do jogo

### Antes do jogo começar

1. **Ligar o sistema** (se não estiver em modo automático)
2. **Abrir o painel** no seu celular ou tablet:
   - Conecte-se ao WiFi da quadra
   - Acesse o endereço que o técnico deixou (algo como `http://192.168.1.50:5173`)
3. **Clicar em "Iniciar Captura"** — o botão fica verde
4. **Aguardar 30 segundos** — o buffer precisa encher antes de gerar o primeiro replay

### Durante o jogo

| Você quer... | Você faz... | O que acontece |
|--------------|-------------|----------------|
| **Replay de um lance** | Aperta o **botão vermelho** na parede (ou clica "Gerar Replay" no celular) | Em ~10 segundos, o vídeo dos últimos 30s sobe no YouTube como Short |
| **Começar uma live** | Clica **"Iniciar Live"** no celular | A quadra vai ao vivo no YouTube em 20–60 segundos |
| **Parar a live** | Clica **"Encerrar Live"** | A transmissão termina; o buffer retoma sozinho |

> ⏱️ **O replay leva quanto tempo para aparecer no YouTube?**
> Geralmente entre 1 e 5 minutos. O vídeo sobe automaticamente com o título:
> `⚽ Replay - Quadra {N} - {DD/MM} às {HH}h{MM} #Shorts`

---

## 📱 Onde encontrar os vídeos

- **Replays (Shorts):** canal do YouTube que você indicou → aba "Shorts"
- **Lives:** canal do YouTube → aba "Transmissões ao vivo" (ou vídeos, depois que terminam)
- O técnico pode deixar o **link do canal** anotado para você compartilhar

---

## 🔴 Quando chamar o suporte

Ligue ou mande mensagem se acontecer algum destes sintomas:

| Problema | O que fazer agora |
|----------|-------------------|
| Painel mostra **"OFFLINE"** | Verificar se o aparelho pequeno (mini PC) está ligado; se estiver, chamar suporte |
| Apertei o botão e **não veio replay no YouTube** | Esperar 10 minutos (pode estar processando). Se não aparecer, chamar suporte |
| A live **caiu do nada** | Verificar se o celular/roteador 4G ainda tem internet; se tiver, chamar suporte |
| **Não consigo abrir o painel** | Verificar se o celular está no WiFi correto da quadra; se estiver, chamar suporte |
| **Som dos vídeos está estranho ou não tem** | O sistema usa microfone da câmera; chamar suporte para ajuste |

> 💡 **Dica:** antes de ligar, tire uma **foto da tela do celular** mostrando o erro. Isso ajuda o técnico a entender o problema em segundos.

---

## 🛠️ Manutenção mínima que você pode fazer

| Com que frequência | O que fazer |
|--------------------|-------------|
| **Semanalmente** | Abrir o painel e verificar se o botão "Iniciar Captura" está verde. Se não estiver, clicar nele. |
| **Mensalmente** | Limpar a lente da câmera com pano de microfibra (sujeira escurece o vídeo). |
| **A cada evento** | Gerar um replay de teste antes do jogo começar, só para confirmar que tudo está funcionando. |

---

## ❓ Perguntas frequentes

### Preciso pagar alguma mensalidade para o YouTube?

**Não.** O YouTube não cobra para fazer lives ou postar Shorts. O que precisa é de uma conta Google (Gmail) com canal ativo.

### Posso usar o canal do clube/escola ou precisa ser um canal novo?

Pode usar **qualquer canal** que já tenha transmissões ao vivo habilitadas. Não precisa criar um canal novo.

### O sistema funciona sem internet?

**Não.** Sem internet, não dá para subir replays nem fazer live. Mas o sistema continua gravando o buffer localmente; assim que a internet voltar, os replays pendentes sobem automaticamente (funcionalidade futura — hoje precisa de internet no momento do upload).

### Posso mudar o número da quadra depois?

Sim. O técnico configura o número da quadra no dia da instalação. Se mudar de endereço ou quiser trocar o número, é só avisar o suporte.

### Quantos replays posso gerar por dia?

Tecnicamente, quantos quiser. Mas o YouTube limita a cota de upload (cerca de 6 Shorts por dia em ritmo intenso). Para um jogo normal de 1–2 horas, isso nunca é problema.

### O botão é à prova d'água?

O botão arcade é robusto, mas **não é à prova d'água**. Se a quadra for aberta e pegar chuva direto, avise na instalação para colocarmos proteção.

### E se alguém apertar o botão sem querer?

Vai gerar um replay e subir no YouTube. É possível apagar o Short depois pelo YouTube Studio. Futuramente teremos confirmação no painel antes de subir.

---

## 📞 Contatos

| Quem | Para quê | Como falar |
|------|----------|------------|
| **Suporte técnico** | Problemas com o sistema, instalação, manutenção | WhatsApp / telefone: `___` |
| **Comercial** | Quer instalar em outra quadra? Quer cancelar? | E-mail / WhatsApp: `___` |
| **YouTube / Google** | Problemas com conta do YouTube, senha, canal | Acesse [support.google.com/youtube](https://support.google.com/youtube) |

---

## 📝 Resumo do que você precisa lembrar

1. **Ligar o sistema** antes do jogo
2. **Esperar 30 segundos** depois de "Iniciar Captura"
3. **Apertar o botão vermelho** para replay
4. **Clicar "Iniciar Live"** no celular para transmitir
5. **Compartilhar o canal do YouTube** com torcedores e pais

> O resto é com a gente. 🏖️
