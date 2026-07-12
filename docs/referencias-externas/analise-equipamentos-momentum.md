# 📊 Planilha Comparativa — Equipamentos para Embarcar o Momentum

> Arquivo complementar: `planilha-custos-equipamentos-momentum.csv` (importe no Excel/Google Sheets)

---

## 🎯 Legenda

| Icone | Significado |
|-------|-------------|
| 🟢 | Altamente recomendado |
| 🟡 | Válido com ressalvas |
| 🔴 | Não recomendado para o estágio atual |
| ⭐ | Melhor custo-benefício da categoria |

---

## 🧪 Categoria 1: Teste / Prova de Conceito (Custo zero ou quase zero)

| Equipamento | CPU / SoC | RAM | Armaz. | PoE | Fanless | Preço (R$) | Custo total* | Quadras | Recom. |
|-------------|-----------|-----|--------|-----|---------|------------|--------------|---------|--------|
| **Notebook próprio + webcam** | Varia | Varia | Varia | ❌ | ❌ | **R$ 0** | R$ 0 | 1 | 🟢 |
| **Raspberry Pi 4B 4GB + SSD USB** | ARM Cortex-A72 | 4GB | SSD USB | ❌ (HAT extra) | Com cooler | ~R$ 700 | ~R$ 900 | 1 | 🟡 |
| **Orange Pi 5 8GB** | Rockchip RK3588S | 8GB | NVMe M.2 | ❌ | Dissipador | ~R$ 1.134 | ~R$ 1.500 | 1 | 🟡 |

\* Custo total = equipamento + infraestrutura obrigatória (injetor PoE, cabo, case, cooler)

### Observações

- **Notebook próprio:** ESSENCIAL. Faça isso antes de comprar qualquer coisa. Valida RTSP, upload e estabilidade de rede na quadra real.
- **Raspberry Pi 4B:** Limitado. Não aguenta buffer + live simultâneos por mais de 1–2h. Cartão SD é propenso a corrupção. Use SSD USB.
- **Orange Pi 5:** Muito superior ao Pi 4/5, com decodificação 8K por hardware. **Problema: fora de estoque no Brasil** (atualização: junho/2026).

---

## 🖥️ Categoria 2: Consumo — 1 Quadra (Produção real)

| Equipamento | CPU / SoC | RAM | Armaz. | PoE | Fanless | Preço (R$) | Custo total* | Quadras | Recom. |
|-------------|-----------|-----|--------|-----|---------|------------|--------------|---------|--------|
| **GMKtec Nucbox G3** ⭐ | Intel N100 / QuickSync | 16GB | 1TB NVMe | ❌ | ❌ | ~R$ 2.681 | ~R$ 2.840 | 1 | 🟢 |
| **MeLE Quieter 4C** ⭐ | Intel N100 / QuickSync | 16GB | 512GB | ❌ | ✅ | ~R$ 2.379 | ~R$ 2.540 | 1 | 🟢 |
| **Beelink Mini S12 Pro** | Intel N100 / QuickSync | 16GB | 500GB | ❌ | ❌ | ~R$ 2.698 | ~R$ 2.860 | 1 | 🟢 |

### Observações

- **N100 + QuickSync:** Aceleração de hardware do FFmpeg essencial para buffer + live simultâneos sem matar a CPU.
- **Fanless (MeLE Quieter 4C):** Ideal para quadras semi-abertas com poeira. Sem ventoinha = sem poeira interna acumulada.
- **Todos precisam de injetor PoE separado** (TP-Link TL-POE150S: ~R$ 120) porque nenhum mini PC de consumo tem PoE nativo.
- **Melhor custo-benefício:** MeLE Quieter 4C (fanless) ou GMKtec Nucbox G3 (mais SSD).

---

## 🏭 Categoria 3: Industrial / Multi-Quadra (Robusto e escalável)

| Equipamento | CPU / SoC | RAM | Armaz. | PoE | Fanless | Preço (R$) | Custo total* | Quadras | Recom. |
|-------------|-----------|-----|--------|-----|---------|------------|--------------|---------|--------|
| **Neousys POC-715** ⭐ | Core i3-N305 / Atom x7425E | Até 32GB | M.2 2280 | ✅ **4x PoE+** | ✅ (-25 a +70°C) | Sob cotação | ~R$ 5.000–8.000 | **4** | 🟢 |
| **T-PI IPC IBOX-205** | Core i5/i7 / Celeron | Varia | M.2 + Mini-PCIe | ✅ **2x PoE** | ✅ (-10 a +55°C) | Sob cotação | ~R$ 4.000–6.000 | 2 | 🟡 |
| **Portwell WEBS-2414** | Core i3/i5/i7 | Varia | Varia | ⚠️ Opcional | ✅ (-10 a +60°C) | Sob cotação | Sob cotação | 2–4 | 🟡 |

### Observações

- **Neousys POC-715:** A única opção com **4x PoE+ nativo**. Conecta 4 câmeras diretamente = 4 quadras com 1 só equipamento. Fanless e industrial. **Solicitar cotação** em [Assured Systems](https://www.assured-systems.com/pt/neousys-poc-715/).
- **T-PI IPC IBOX-205:** 2x PoE + 2x 2.5GbE. Rede mais rápida, mas só alimenta 2 câmeras direto. Para 4 quadras precisaria de switch PoE extra.
- **Portwell WEBS-2414:** Modular. PoE pode ser adicionado via placa de expansão. Distribuidor no Brasil (Curitiba/PR).
- **Lead time industrial:** 30–60 dias (importação). Preço B2B sob cotação — estimamos R$ 5.000–8.000 para o POC-715 no Brasil com impostos.

---

## 🤖 Categoria 4: Edge AI (Overkill para hoje, reservado para futuro)

| Equipamento | CPU / SoC | GPU / NPU | RAM | Preço (R$) | Custo total* | Quadras | Recom. |
|-------------|-----------|-----------|-----|------------|--------------|---------|--------|
| **reComputer J3011** (Orin Nano 8GB) | ARM + NVIDIA | 40 TOPS | 8GB | ~R$ 11.310 | ~R$ 11.500 | 1 | 🔴 |
| **ASUS PE1100N** (Orin NX 16GB) | ARM + NVIDIA | 100 TOPS | 16GB DDR5 | ~R$ 23.409 | ~R$ 23.600 | 1 | 🔴 |

### Observações

- **Edge AI só faz sentido se:** você adicionar detecção de bola, jogadores, placar automático, ou análise de jogo com IA.
- Para o Momentum **hoje** (buffer + replay + live), esses equipamentos são **10x mais caros** e não entregam benefício proporcional.
- **Recomendação:** Deixar para o **Roadmap fase 2**, se o cliente solicitar features de IA.

---

## 📈 Gráfico de Decisão (fluxo)

```
Software validado em notebook com webcam?
    └── SIM
        └── Já testou na quadra com câmera IP + notebook?
            └── SIM — FUNCIONOU
                └── Quantas quadras o cliente quer?
                    ├── 1 quadra  → Comprar N100 fanless (MeLE) + injetor PoE
                    ├── 2–4 quadras → Solicitar cotação Neousys POC-715
                    └── 4+ quadras → Cotação customizada (multi-servidor ou POC-715 + switch)
            └── FALHOU → Debugar (rede? CPU? Câmera?). NÃO comprar ainda.
        └── NÃO → Levar notebook para quadra primeiro
    └── NÃO → Validar software localmente (buffer.ts em RTSP)
```

---

## 💰 Resumo de Custo por Cenário

| Cenário | Equipamento principal | Infraestrutura | Custo total estimado |
|---------|----------------------|----------------|---------------------|
| **Teste de campo** | Notebook + câmera emprestada | Hotspot celular | **R$ 0** |
| **1 quadra (orçamento)** | Raspberry Pi 4B 4GB + SSD | HAT PoE + cooler + case + cabo | **~R$ 900** |
| **1 quadra (produção)** | MeLE Quieter 4C (N100 fanless) | Injetor PoE + cabo 15m + câmera IP | **~R$ 2.900** |
| **1 quadra (top)** | GMKtec Nucbox G3 (N100 1TB) | Injetor PoE + cabo + câmera VIP 1230 B G5 | **~R$ 3.100** |
| **2 quadras** | 2x MeLE Quieter 4C + 2x injetores | Cabos + 2 câmeras | **~R$ 5.400** |
| **4 quadras (1 servidor)** | Neousys POC-715 (cotação) | 4x cabos + 4 câmeras + switch se necessário | **~R$ 6.500–9.500** |
| **4 quadras (4 mini PCs)** | 4x MeLE Quieter 4C | 4x injetores + cabos + câmeras | **~R$ 10.200** |

### Diferença chave:

- **4x N100 separados:** ~R$ 10.200. Mais complexo de gerenciar (4 Windows, 4 tokens OAuth, 4 instâncias).
- **1x POC-715:** ~R$ 6.500–9.500. Um só Linux/Windows, um só token, um só ponto de falha. **Economia de ~R$ 1.000–3.000 + menos dor de cabeça operacional.**

---

## 🛒 Links Rápidos de Compra

| Produto | Link |
|---------|------|
| GMKtec Nucbox G3 (N100/16GB/1TB) | [Amazon](https://www.amazon.com.br/GMKtec-16GB-1TB-Computador-Nucbox/dp/B0D5CLW8G8) |
| MeLE Quieter 4C (N100 fanless) | [Amazon](https://www.amazon.com.br/s?k=MeLE+Quieter+4C) |
| Beelink Mini S12 Pro | [Amazon](https://www.amazon.com.br/s?k=Beelink+Mini+S12+Pro) |
| Injetor PoE TP-Link TL-POE150S | [NR Store](https://www.nrstore.com.br/www-nrstore-com-br/tp-link-tl-poe150s-omada-poe-injector-splitter) |
| Câmera Intelbras VIP 1230 B G5 (PoE + microfone) | [Distribuidor CFTV](https://www.distribuidorcftv.com.br/loja/produto-240387-5051-camera_infra_bullet_ip_full_hd_2_0_megapixels_3_6mm_86_poe_ip67_onvif_microfone_embutido_intelbras_vip_1230_b_g5) |
| Neousys POC-715 (cotação B2B) | [Assured Systems](https://www.assured-systems.com/pt/neousys-poc-715/) |
| T-PI IPC IBOX-205 (cotação B2B) | [T-PI IPC](https://www.tpipc.com/product/ibox-205-4l2c2p/) |
| Orange Pi 5 8GB (fora de estoque) | [Reduza](https://www.reduza.com.br/orange-pi-5-8gb-rockchip-rk3588s-8-core-64-bit-computador-de-placa-unica-suporte-a-codec-de-video-8k-e-ate-24ghz-compativel-orange-piubuntudebianandroid-12-os-pi-5-8gb/pr) |

---

## 📌 Checklist Antes de Comprar

- [ ] Validar com notebook na quadra (RTSP + upload + live funciona?)
- [ ] Medir distância câmera → ponto do PC (comprar cabo Ethernet correto)
- [ ] Confirmar cobertura 4G / velocidade de upload na quadra (speedtest)
- [ ] Verificar se o canal do cliente já tem live habilitada no YouTube
- [ ] Decidir: 1 quadra agora (N100) ou já planejar multi-quadra (POC-715)?
- [ ] Orçar POC-715 se for multi-quadra (lead time 30–60 dias)

---

*Atualizado em: 08/06/2026*
