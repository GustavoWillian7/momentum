# 🛠️ Guia de Hardware — Teste e Setup Definitivo

> Documento vivo. Preços e links podem mudar; validar antes de comprar.

---

## 📋 Introdução

Este documento detalha **dois caminhos** para o setup do Momentum em uma quadra real:

1. **Teste de Validação** — custo zero ou quase zero, usando equipamento que você já possui.
2. **Setup Definitivo** — lista completa de compras para instalação permanente.

A recomendação do time é seguir a ordem: **valide primeiro, depois compre tudo**. O software já foi validado em notebook com webcam; a incerteza restante é a **integração com câmera IP via RTSP + rede 4G**.

---

## 🧪 Fase 1 — Teste de Validação

Objetivo: confirmar que o sistema funciona na quadra real **sem gastar com hardware novo**.

| Item | O que usar | Custo estimado |
|------|-----------|----------------|
| Computador | Seu próprio **notebook** (já validado com webcam) | R$ 0 |
| Internet | **Celular como hotspot** (4G/5G) | R$ 0 |
| Câmera | **Câmera IP emprestada ou alugada** (pedir a amigo com CFTV, ou alugar 1 dia com empresa local) | R$ 0 – 50 |
| Botão | Tecla do teclado (`R` + Enter no terminal do backend) ou clique no painel web | R$ 0 |
| Energia | Tomada próxima ou power bank para notebook | R$ 0 |

### Pré-requisito técnico para o teste

Antes de levar o notebook para a quadra, o `buffer.ts` **precisa estar migrado de `vfwcap` para RTSP**.

- `vfwcap` só funciona no Windows com webcam local.
- Câmeras IP usam **RTSP** (`rtsp://usuario:senha@ip/stream`).

> Se o código ainda usar `vfwcap`, o teste falhará independentemente da câmera.

### O que validar no dia do teste

- [ ] Buffer grava segmentos de 5s sem travamentos por pelo menos 10 minutos
- [ ] Replay é gerado em < 10s e publicado como Short no YouTube
- [ ] Live sobe e fica estável por 5 minutos (monitorar no YouTube Studio)
- [ ] CPU do notebook não passa de 70% durante buffer + live simultâneos
- [ ] Upload de vídeo via hotspot 4G é suficiente (YouTube exige ~3–5 Mbps de upload estável)

---

## 🛒 Fase 2 — Setup Definitivo (Compras)

Se o teste de validação for bem-sucedido, compre os itens abaixo.

---

### 1. Mini PC — Intel N100

**Requisito mínimo:** N100 / 16GB RAM / SSD 256GB+ com WiFi 6 e Ethernet.
O N100 tem **Intel UHD Graphics com QuickSync**, que o FFmpeg pode usar para decodificação/aceleração de vídeo — essencial para buffer + live simultâneos sem matar a CPU.

| Modelo | Configuração | Preço aprox. | Link |
|--------|-------------|--------------|------|
| **GMKtec Nucbox G3** | N100 / 16GB / **1TB SSD** | ~R$ 2.681 | [Amazon.com.br](https://www.amazon.com.br/GMKtec-16GB-1TB-Computador-Nucbox/dp/B0D5CLW8G8) |
| **GMKtec G3** (importação) | N100 / 16GB / 512GB SSD | ~R$ 1.350 (conversão) | [Gearbest](https://www.gearbest.ma/pt/product/gmktec-g3-mini-pc-intel-alder-lake-n100-windows-11-pro-mini-pc-8-16gb-ddr4-256-512gb-pcie-m-2-ssd-wifi-6-bt5-2-desktop-computer/) |
| **KAMRUI AK1Plus** (importação) | N100 / 16GB / 256GB SSD | ~R$ 1.100 (conversão) | [Gearbest](https://www.gearbest.ma/product/mini-pc-kamrui-ak1plus-intel-n95-n100-ddr4-8-12-16gb-256-512gb-1tb-ssd-windows11-hdmi-4k60hz-wifi5-6-bt4-2-5-2-desktop-computer/) |
| **Inovattio Little N100** (nacional, fanless) | N100 / 8GB (expansível) / 256GB | ~R$ 3.177 | [Loja Inovattio](https://www.lojainovattio.com.br/little-n100-automacao-industrial) |

> ⚠️ **Atenção:** o N100 é um processador de entrada. 16GB de RAM são **não negociáveis** para rodar FFmpeg (buffer + live + upload) + Node.js + React sem swap. SSD de 256GB é suficiente (os vídeos temporários são deletados automaticamente), mas 512GB dá folga.

---

### 2. Câmera IP PoE (externa)

**Requisitos técnicos obrigatórios:**
- **RTSP** (o FFmpeg captura por esse protocolo)
- **ONVIF** (facilita descoberta de stream URL e configuração)
- **PoE 802.3af** (simplifica instalação — um único cabo de rede leva dados + energia)
- **IP67** (uso externo em quadra)

| Modelo | Destaques | Preço aprox. | Link |
|--------|-----------|--------------|------|
| **Intelbras VIPC 1230 B G2** | 1080p, PoE, IP67, ONVIF, RTSP, IR 30m | ~R$ 280 | [Distribuidor CFTV](https://www.distribuidorcftv.com.br/loja/produto-240387-4993-camera_bullet_ip_full_hd_2_0_megapixels_poe_ip67_onvif_h_265_ir_30mts_intelbras_vipc_1230_b_g2) |
| **Intelbras VIP 1230 B G5** ⭐ | 1080p, PoE, **microfone embutido**, detecção de pessoas | Preço sob consulta | [Distribuidor CFTV](https://www.distribuidorcftv.com.br/loja/produto-240387-5051-camera_infra_bullet_ip_full_hd_2_0_megapixels_3_6mm_86_poe_ip67_onvif_microfone_embutido_intelbras_vip_1230_b_g5) |
| **Intelbras VIP 3230 IK** | 1080p, PoE, IP67 + **IK10** (antivandalismo) | Preço sob consulta | [B2B Make Distribuidora](https://b2bmakedistribuidora.com.br/produtos/detalhes/4564195/camera-de-video-ip-vip-3230-ik/) |

> ⭐ **Recomendação:** a **VIP 1230 B G5** com microfone embutido resolve duas armadilhas do sistema de uma vez:
> 1. Áudio sintético (`anullsrc`) na live → substituído por áudio real da quadra
> 2. Replays sem áudio → o stream RTSP já traz faixa de áudio AAC, que o FFmpeg pode preservar

---

### 3. Infraestrutura de rede (esquecido fácil)

O mini PC N100 **não tem porta PoE**. Sem um injetor ou switch PoE, a câmera não liga.

| Item | Para que serve | Preço aprox. | Link |
|------|---------------|--------------|------|
| **Injetor PoE TP-Link TL-POE150S** | Alimenta **1 câmera** via cabo de rede (plug-and-play) | ~R$ 108 – 140 | [NR Store](https://www.nrstore.com.br/www-nrstore-com-br/tp-link-tl-poe150s-omada-poe-injector-splitter) / [Mega Smart](https://www.megasmart.com.br/tp-link/tp-link-tl-poe150s-poe-injector-splitter) |
| **Switch PoE TP-Link TL-SG1005P** | Alimenta **até 4 câmeras** (se expandir para multi-quadra depois) | ~R$ 255 | [NR Store](https://www.nrstore.com.br/tp-link-switch-5-portas-gigabit-com-4-portas-poe-tl-sg1005p) |
| **Cabo de rede (Ethernet)** | Liga câmera → injetor/switch → mini PC | ~R$ 30 – 50 (10–20m) | Qualquer loja de informática |

> **Topologia mínima:**
> ```
> Câmera IP ---(cabo PoE)---> Injetor PoE ---(cabo normal)---> Mini PC N100
>                                    |
>                              Tomada de energia
> ```

---

### 4. Botão Arcade + Placa Zero Delay

O backend já escuta teclado, mas para instalação física na quadra precisa de um botão robusto (resistente a poeira, impacto, e uso por crianças/adultos).

| Produto | Conteúdo | Preço aprox. | Link |
|---------|---------|--------------|------|
| **Kit completo** | Botões 30mm tipo Sanwa + joystick + placa zero delay | ~R$ 109 | [Shopee via Melhora o Preço](https://melhoraopreco.com.br/ofertas/shopee/7811348) |
| **Apenas placa zero delay** (quando voltar ao estoque) | Placa + cabos jumper + USB | ~R$ 50 – 70 | [RS Robótica](https://www.rsrobotica.com.br/produto/placa-usb-zero-delay-com-cabos.html) / [SmartProjects](https://www.smartprojectsbrasil.com.br/placa-usb-zero-delay-pcps3ps4legacyaegir-com-15-cabos) |

> 💡 Se você quer **apenas 1 botão** "Replay" (sem joystick), compre só o botão arcade 30mm + placa zero delay. Kits assim custam ~R$ 60 na Shopee.

---

### 5. Roteador 4G / Internet na quadra

Se a quadra não tiver WiFi estável, precisa de um modem 4G dedicado.

| Opção | Preço aprox. | Observação |
|-------|--------------|------------|
| **TP-Link M7200** (MiFi 4G) | ~R$ 250 – 400 | Verificar versão brasileira com bandas B2/B28 no [site oficial TP-Link Brasil](https://www.tp-link.com/br/) |
| **Huawei E5576** (MiFi 4G) | ~R$ 200 – 300 | Disponível no Mercado Livre; verificar compatibilidade de bandas |
| **Smartphone velho como hotspot** | R$ 0 | Deixar ligado na tomada com plano de dados; funciona bem se já tiver um aparelho sobrando |

> **Requisito de upload:** o YouTube Live precisa de **3–5 Mbps de upload estáveis** para 720p. Antes de comprar o roteador, faça um speedtest na quadra com seu celular para confirmar que a operadora local entrega isso.

---

## 💰 Resumo de custos (Setup Definitivo)

| Item | Preço aproximado (nacional) |
|------|------------------------------|
| Mini PC N100 / 16GB / 256GB+ | R$ 1.500 – 2.700 |
| Câmera IP PoE Intelbras | R$ 280 – 400 |
| Injetor PoE | R$ 110 – 140 |
| Botão arcade + placa zero delay | R$ 60 – 110 |
| Roteador 4G / Modem MiFi | R$ 200 – 400 |
| Cabo de rede (10–20m) | R$ 30 – 50 |
| **TOTAL** | **~R$ 2.200 – 3.800** |

---

## ✅ Checklist de decisão

Use este fluxo antes de comprar:

```
Software validado em notebook com webcam?
    └── SIM
        └── Buffer.ts migrado para RTSP?
            └── SIM
                └── Teste na quadra com câmera IP emprestada + notebook?
                    └── FUNCIONOU
                        └── COMPRAR TUDO AGORA (setup definitivo)
                    └── FALHOU
                        └── DEBUGAR PROBLEMA (CPU? Rede? Câmera?)
                        └── SÓ COMPRAR DEPOIS DE RESOLVER
            └── NÃO
                └── MIGRAR PARA RTSP PRIMEIRO
        └── NÃO
            └── VALIDAR SOFTWARE LOCALMENTE PRIMEIRO
```

---

## 🔗 Links úteis

- Intelbras (câmeras, datasheets): https://www.intelbras.com.br
- TP-Link Brasil (injetores/switches): https://www.tp-link.com/br/
- NR Store (redes e PoE): https://www.nrstore.com.br
- Shopee (botões arcade): buscar por "kit arcade zero delay"
