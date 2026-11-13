import { getSupabase } from '../config/supabaseConfig.js';

let insumosCache = [];
let orcamentosList = [];
let currentPhotoBase64 = null;

export async function renderOrcamentosModule(container) {
    currentPhotoBase64 = null;

    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-orcamentos" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Calculadora & Orçamentos</h1>
                        <p>Suporte a múltiplas cores, anexo de foto e exportação de proposta em imagem</p>
                    </div>
                </div>
            </div>

            <!-- Área Principal da Calculadora -->
            <div class="calc-layout">
                
                <!-- Coluna Esquerda: Parâmetros -->
                <div class="calc-panel">
                    <div class="panel-section-title">
                        <i class="ph-duotone ph-identification-card"></i>
                        Dados e Foto do Projeto
                    </div>
                    <div class="calc-grid">
                        <div class="calc-field">
                            <label>Nome do Cliente *</label>
                            <input type="text" id="orc-cliente" placeholder="Ex: João Silva">
                        </div>
                        <div class="calc-field">
                            <label>Peça / Projeto *</label>
                            <input type="text" id="orc-projeto" placeholder="Ex: Action Figure Chun-Li 22cm">
                        </div>
                    </div>

                    <!-- Upload de Foto -->
                    <label class="photo-upload-box" for="orc-foto-input">
                        <div class="photo-preview-thumb" id="foto-preview-box">
                            <i class="ph-duotone ph-camera-plus"></i>
                        </div>
                        <div class="photo-upload-info">
                            <strong id="foto-status-title">Adicionar Foto de Referência da Peça (Opcional)</strong>
                            <span>Clique para selecionar uma imagem do modelo ou render (JPG/PNG)</span>
                        </div>
                        <input type="file" id="orc-foto-input" accept="image/*" hidden>
                    </label>

                    <div class="panel-section-title">
                        <i class="ph-duotone ph-spool"></i>
                        Filamentos / Cores Utilizadas
                    </div>

                    <!-- Lista de Filamentos (Suporta Múltiplas Cores) -->
                    <div class="filamentos-container" id="filamentos-list"></div>

                    <button type="button" class="btn-add-filament" id="btn-add-filamento">
                        <i class="ph-bold ph-plus-circle"></i>
                        Adicionar Outra Cor / Filamento
                    </button>

                    <div class="panel-section-title">
                        <i class="ph-duotone ph-timer"></i>
                        Tempo de Impressão & Perdas
                    </div>
                    <div class="calc-grid">
                        <div class="calc-field">
                            <label>Tempo Total de Impressão (Horas)</label>
                            <input type="number" id="orc-horas" value="4.5" min="0.1" step="0.1">
                        </div>
                        <div class="calc-field">
                            <label>Quantidade de Peças</label>
                            <input type="number" id="orc-qtd" value="1" min="1">
                        </div>
                        <div class="calc-field full">
                            <label>Margem de Perda / Torre de Purga AMS (%)</label>
                            <input type="number" id="orc-perda" value="10" min="0" max="200">
                        </div>
                    </div>

                    <div class="panel-section-title">
                        <i class="ph-duotone ph-sliders"></i>
                        Custos Operacionais & Margem
                    </div>
                    <div class="calc-grid" style="margin-bottom: 0;">
                        <div class="calc-field">
                            <label>Custo Hora Máquina + Energia (R$/h)</label>
                            <input type="number" id="orc-hora-maq" value="2.50" min="0" step="0.10">
                        </div>
                        <div class="calc-field">
                            <label>Pós-Processamento / Pintura / Embalagem (R$)</label>
                            <input type="number" id="orc-extras" value="0.00" min="0" step="0.50">
                        </div>
                        <div class="calc-field">
                            <label>Taxa Plataforma / Cartão (%)</label>
                            <input type="number" id="orc-taxa" value="0" min="0" max="100" step="0.5">
                        </div>
                        <div class="calc-field">
                            <label>Margem de Lucro Desejada (%)</label>
                            <input type="number" id="orc-lucro" value="150" min="0" step="5">
                        </div>
                    </div>
                </div>

                <!-- Coluna Direita: Resultado em Tempo Real -->
                <div class="result-panel">
                    <div class="panel-section-title">
                        <i class="ph-duotone ph-receipt"></i>
                        Detalhamento de Custos
                    </div>

                    <div class="breakdown-list">
                        <div class="breakdown-item">
                            <span>Peso Total (<span id="res-peso-total">0g</span> + perda):</span>
                            <strong id="res-custo-mat">R$ 0,00</strong>
                        </div>
                        <div class="breakdown-item">
                            <span>Energia & Depreciação Máquina:</span>
                            <strong id="res-custo-maq">R$ 0,00</strong>
                        </div>
                        <div class="breakdown-item">
                            <span>Acabamento / Extras:</span>
                            <strong id="res-custo-ext">R$ 0,00</strong>
                        </div>
                        <div class="breakdown-divider"></div>
                        <div class="breakdown-item">
                            <span>Custo Base de Produção:</span>
                            <strong id="res-custo-total" style="color: var(--text-primary);">R$ 0,00</strong>
                        </div>
                        <div class="breakdown-item">
                            <span>Taxas / Impostos:</span>
                            <strong id="res-taxas">R$ 0,00</strong>
                        </div>
                    </div>

                    <div class="price-highlight-box">
                        <span>Preço Sugerido ao Cliente</span>
                        <div class="final-price" id="res-preco-final">R$ 0,00</div>
                        <div class="unit-price" id="res-preco-unitario">R$ 0,00 por unidade</div>
                    </div>

                    <div class="profit-badge">
                        <span>Lucro Líquido Estimado:</span>
                        <strong id="res-lucro-liquido">R$ 0,00</strong>
                    </div>

                    <div class="result-actions">
                        <button type="button" class="btn-primary" id="btn-salvar-orcamento">
                            <i class="ph-bold ph-floppy-disk"></i>
                            Salvar Orçamento & Gerar Imagem
                        </button>
                        <button type="button" class="btn-whatsapp" id="btn-copiar-zap">
                            <i class="ph-bold ph-whatsapp-logo"></i>
                            Copiar Texto para WhatsApp
                        </button>
                    </div>
                </div>

            </div>

            <!-- Histórico de Orçamentos -->
            <div class="history-section">
                <div class="panel-section-title">
                    <i class="ph-duotone ph-clock-counter-clockwise"></i>
                    Orçamentos Recentes
                </div>
                <div class="orcamentos-list" id="orcamentos-list"></div>
            </div>
        </div>

        <!-- Modal de Visualização e Download da Imagem do Orçamento -->
        <div class="modal-overlay hidden" id="modal-quote-image">
            <div class="modal-box quote-image-modal">
                <div class="modal-header">
                    <h2>Cartão de Orçamento</h2>
                    <button class="btn-icon" id="btn-close-quote-img"><i class="ph-bold ph-x"></i></button>
                </div>

                <!-- Área que será convertida em PNG -->
                <div class="quote-capture-card" id="quote-capture-area"></div>

                <div class="modal-actions" style="margin-top: 1.25rem;">
                    <button type="button" class="btn-secondary" id="btn-fechar-preview">Fechar</button>
                    <button type="button" class="btn-primary" id="btn-download-png">
                        <i class="ph-bold ph-download-simple"></i>
                        Baixar Imagem PNG
                    </button>
                </div>
            </div>
        </div>
    `;

    await loadInsumosCache();
    addFilamentRow(85); // Adiciona a primeira linha de filamento padrão
    bindOrcamentosEvents(container);
    calculatePrice();
    await loadOrcamentosHistory();
}

async function loadInsumosCache() {
    const supabase = getSupabase();
    if (supabase) {
        const { data } = await supabase.from('insumos').select('*').order('material');
        if (data) insumosCache = data;
    } else {
        const saved = localStorage.getItem('uruz_insumos');
        insumosCache = saved ? JSON.parse(saved) : [];
    }
}

function buildInsumoOptionsHTML() {
    if (insumosCache.length === 0) {
        return `<option value="manual" data-custo="120" data-nome="Filamento Padrão">Padrão Manual (R$ 120,00 / kg)</option>`;
    }
    return insumosCache.map(item => `
        <option value="${item.id}" data-custo="${item.custo_base}" data-nome="${item.material} ${item.cor}">
            ${item.material} • ${item.cor} (${item.marca}) — R$ ${Number(item.custo_base).toFixed(2)}/kg
        </option>
    `).join('') + `<option value="manual" data-custo="120" data-nome="Outro Filamento">Outro Material (R$ 120,00 / kg)</option>`;
}

function addFilamentRow(defaultWeight = 30) {
    const list = document.getElementById('filamentos-list');
    const row = document.createElement('div');
    row.className = 'filamento-row';

    row.innerHTML = `
        <select class="fil-select">
            ${buildInsumoOptionsHTML()}
        </select>
        <input type="number" class="fil-peso" value="${defaultWeight}" min="1" step="0.1" placeholder="Gramas (g)" title="Peso em gramas">
        <button type="button" class="btn-icon delete btn-remove-fil" title="Remover cor">
            <i class="ph ph-trash"></i>
        </button>
    `;

    row.querySelector('.fil-select').addEventListener('change', calculatePrice);
    row.querySelector('.fil-peso').addEventListener('input', calculatePrice);
    row.querySelector('.btn-remove-fil').addEventListener('click', () => {
        if (list.children.length > 1) {
            row.remove();
            calculatePrice();
        } else {
            alert('É necessário manter pelo menos 1 filamento no orçamento.');
        }
    });

    list.appendChild(row);
    calculatePrice();
}

function getFilamentosData() {
    const rows = document.querySelectorAll('.filamento-row');
    const items = [];
    let pesoTotalG = 0;
    let custoTotalMaterialBase = 0;

    rows.forEach(row => {
        const select = row.querySelector('.fil-select');
        const peso = Number(row.querySelector('.fil-peso').value) || 0;
        const opt = select.options[select.selectedIndex];
        const custoKg = opt ? Number(opt.getAttribute('data-custo')) : 120;
        const nome = opt ? opt.getAttribute('data-nome') : 'Filamento';

        pesoTotalG += peso;
        custoTotalMaterialBase += (peso / 1000) * custoKg;

        items.push({
            insumo_id: select.value !== 'manual' ? select.value : null,
            nome,
            peso_g: peso,
            custo_kg: custoKg
        });
    });

    return { items, pesoTotalG, custoTotalMaterialBase };
}

function calculatePrice() {
    const { items, pesoTotalG, custoTotalMaterialBase } = getFilamentosData();

    const horas = Number(document.getElementById('orc-horas').value) || 0;
    const qtd = Math.max(1, Number(document.getElementById('orc-qtd').value) || 1);
    const perdaPct = Number(document.getElementById('orc-perda').value) || 0;
    const horaMaq = Number(document.getElementById('orc-hora-maq').value) || 0;
    const extras = Number(document.getElementById('orc-extras').value) || 0;
    const taxaPct = Number(document.getElementById('orc-taxa').value) || 0;
    const lucroPct = Number(document.getElementById('orc-lucro').value) || 0;

    // 1. Custo do material com margem de perda/purga AMS
    const custoMaterialComPerda = custoTotalMaterialBase * (1 + perdaPct / 100);

    // 2. Custo de máquina e energia
    const custoMaquina = horas * horaMaq;

    // 3. Custo total de produção (para o lote)
    const custoProducaoTotal = (custoMaterialComPerda + custoMaquina + extras) * qtd;

    // 4. Aplicação da margem de lucro
    const valorComLucro = custoProducaoTotal * (1 + lucroPct / 100);

    // 5. Ajuste para cobrir taxa de plataforma/cartão
    const divisorTaxa = Math.max(0.1, 1 - (taxaPct / 100));
    const precoFinal = valorComLucro / divisorTaxa;
    const valorTaxas = precoFinal - valorComLucro;
    const lucroLiquido = valorComLucro - custoProducaoTotal;
    const precoUnitario = precoFinal / qtd;

    // Atualiza UI
    document.getElementById('res-peso-total').textContent = `${pesoTotalG}g`;
    document.getElementById('res-custo-mat').textContent = formatBRL(custoMaterialComPerda * qtd);
    document.getElementById('res-custo-maq').textContent = formatBRL(custoMaquina * qtd);
    document.getElementById('res-custo-ext').textContent = formatBRL(extras * qtd);
    document.getElementById('res-custo-total').textContent = formatBRL(custoProducaoTotal);
    document.getElementById('res-taxas').textContent = formatBRL(valorTaxas);
    document.getElementById('res-preco-final').textContent = formatBRL(precoFinal);
    document.getElementById('res-preco-unitario').textContent = `${formatBRL(precoUnitario)} por unidade (${qtd}x)`;
    document.getElementById('res-lucro-liquido').textContent = formatBRL(lucroLiquido);

    const resumoMateriais = items.map(i => `${i.nome} (${i.peso_g}g)`).join(' + ');

    return {
        items,
        resumoMateriais,
        pesoTotalG,
        custoProducaoTotal,
        precoFinal,
        precoUnitario,
        qtd,
        horas,
        lucroPct
    };
}

function bindOrcamentosEvents(container) {
    document.getElementById('btn-close-orcamentos').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    // Adicionar novo filamento
    document.getElementById('btn-add-filamento').addEventListener('click', () => addFilamentRow(25));

    // Upload e compressão da foto da peça
    document.getElementById('orc-foto-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Redimensiona para max 600px para manter leve no banco e nítido no card
                const canvas = document.createElement('canvas');
                const maxDim = 600;
                let w = img.width;
                let h = img.height;

                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);

                document.getElementById('foto-preview-box').innerHTML = `<img src="${currentPhotoBase64}" alt="Preview">`;
                document.getElementById('foto-status-title').textContent = `Foto anexada: ${file.name}`;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Recalcula em qualquer alteração nos inputs gerais
    const inputs = container.querySelectorAll('.calc-panel > .calc-grid input');
    inputs.forEach(el => {
        el.addEventListener('input', calculatePrice);
        el.addEventListener('change', calculatePrice);
    });

    // Salvar Orçamento e abrir gerador de imagem
    document.getElementById('btn-salvar-orcamento').addEventListener('click', async () => {
        const cliente = document.getElementById('orc-cliente').value.trim();
        const projeto = document.getElementById('orc-projeto').value.trim();

        if (!cliente || !projeto) {
            alert('Preencha o Nome do Cliente e o Nome do Projeto antes de salvar.');
            return;
        }

        const calc = calculatePrice();
        const novoOrcamento = {
            cliente,
            projeto,
            insumo_id: calc.items[0]?.insumo_id || null,
            material_nome: calc.resumoMateriais,
            filamentos_json: calc.items,
            foto_url: currentPhotoBase64,
            peso_g: calc.pesoTotalG,
            tempo_horas: calc.horas,
            quantidade: calc.qtd,
            custo_producao: Number(calc.custoProducaoTotal.toFixed(2)),
            margem_lucro: calc.lucroPct,
            preco_final: Number(calc.precoFinal.toFixed(2)),
            status: 'Pendente'
        };

        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.from('orcamentos').insert([novoOrcamento]);
            if (error) {
                console.error(error);
                alert('Erro ao salvar no Supabase. Verifique se rodou o ALTER TABLE.');
                return;
            }
        } else {
            orcamentosList.unshift({ id: Date.now().toString(), created_at: new Date().toISOString(), ...novoOrcamento });
            localStorage.setItem('uruz_orcamentos', JSON.stringify(orcamentosList));
        }

        // Abre o modal com o cartão visual do orçamento recém-salvo
        openQuoteImageModal(novoOrcamento);

        // Limpa campos para o próximo
        document.getElementById('orc-cliente').value = '';
        document.getElementById('orc-projeto').value = '';
        currentPhotoBase64 = null;
        document.getElementById('foto-preview-box').innerHTML = `<i class="ph-duotone ph-camera-plus"></i>`;
        document.getElementById('foto-status-title').textContent = 'Adicionar Foto de Referência da Peça (Opcional)';

        await loadOrcamentosHistory();
    });

    // Copiar proposta em texto para WhatsApp
    document.getElementById('btn-copiar-zap').addEventListener('click', () => {
        const cliente = document.getElementById('orc-cliente').value.trim() || 'Cliente';
        const projeto = document.getElementById('orc-projeto').value.trim() || 'Peça Personalizada 3D';
        const calc = calculatePrice();

        const texto = `*ORÇAMENTO - URUZ 3D PRINTING LAB*\n\n` +
            `Olá, *${cliente}*! Segue o orçamento para o seu projeto:\n\n` +
            `• *Projeto:* ${projeto}\n` +
            `• *Materiais:* ${calc.resumoMateriais}\n` +
            `• *Quantidade:* ${calc.qtd} un.\n` +
            `• *Valor Unitário:* ${formatBRL(calc.precoUnitario)}\n` +
            `• *Valor Total:* *${formatBRL(calc.precoFinal)}*\n\n` +
            `_Qualquer dúvida ou ajuste de tamanho/cor, estou à disposição!_`;

        navigator.clipboard.writeText(texto).then(() => {
            const btn = document.getElementById('btn-copiar-zap');
            const original = btn.innerHTML;
            btn.innerHTML = `<i class="ph-bold ph-check"></i> Proposta Copiada!`;
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    });

    // Eventos do Modal de Imagem
    document.getElementById('btn-close-quote-img').addEventListener('click', closeQuoteImageModal);
    document.getElementById('btn-fechar-preview').addEventListener('click', closeQuoteImageModal);
    document.getElementById('btn-download-png').addEventListener('click', downloadQuoteAsPNG);
}

function openQuoteImageModal(orc) {
    const modal = document.getElementById('modal-quote-image');
    const captureArea = document.getElementById('quote-capture-area');
    const unitario = Number(orc.preco_final) / Math.max(1, Number(orc.quantidade));
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    const materiaisTexto = (orc.filamentos_json && orc.filamentos_json.length > 0)
        ? orc.filamentos_json.map(f => f.nome).join(' • ')
        : (orc.material_nome || 'Filamento 3D');

    captureArea.innerHTML = `
        <div class="qcard-header">
            <div class="qcard-brand">
                <img src="assets/img/logo-uruz.png" alt="URUZ" onerror="this.style.display='none'">
                <div class="qcard-brand-text">
                    <h4>URUZ 3D</h4>
                    <span>Printing Lab</span>
                </div>
            </div>
            <div class="qcard-badge">Orçamento • ${dataHoje}</div>
        </div>

        <div class="qcard-body ${orc.foto_url ? 'has-photo' : ''}">
            ${orc.foto_url ? `<img src="${orc.foto_url}" class="qcard-photo" alt="Foto da Peça">` : ''}
            <div class="qcard-details">
                <h3>${orc.projeto}</h3>
                <div class="qcard-client">Cliente: <strong>${orc.cliente}</strong></div>
                <div class="qcard-specs-list">
                    <div><strong>Materiais:</strong> ${materiaisTexto}</div>
                    <div><strong>Quantidade:</strong> ${orc.quantidade} unidade(s)</div>
                    <div><strong>Validade:</strong> 7 dias</div>
                </div>
            </div>
        </div>

        <div class="qcard-footer">
            <div class="qcard-unit">
                Valor unitário: ${formatBRL(unitario)}
            </div>
            <div class="qcard-total-box">
                <span>Investimento Total</span>
                <strong>${formatBRL(orc.preco_final)}</strong>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeQuoteImageModal() {
    document.getElementById('modal-quote-image').classList.add('hidden');
}

async function downloadQuoteAsPNG() {
    const captureArea = document.getElementById('quote-capture-area');
    const btn = document.getElementById('btn-download-png');

    if (typeof html2canvas === 'undefined') {
        alert('Biblioteca de imagem ainda carregando. Aguarde 1 segundo e tente novamente.');
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph-bold ph-spinner"></i> Gerando PNG...`;

    try {
        const canvas = await html2canvas(captureArea, {
            backgroundColor: '#09090b',
            scale: 2, // Alta resolução (Retina)
            useCORS: true
        });

        const link = document.createElement('a');
        link.download = `Orcamento-URUZ-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Erro ao gerar PNG:', err);
        alert('Não foi possível gerar a imagem.');
    } finally {
        btn.innerHTML = originalText;
    }
}

async function loadOrcamentosHistory() {
    const supabase = getSupabase();
    if (supabase) {
        const { data } = await supabase
            .from('orcamentos')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) orcamentosList = data;
    } else {
        const saved = localStorage.getItem('uruz_orcamentos');
        orcamentosList = saved ? JSON.parse(saved) : [];
    }

    renderOrcamentosList();
}

function renderOrcamentosList() {
    const listEl = document.getElementById('orcamentos-list');
    if (orcamentosList.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">Nenhum orçamento salvo ainda.</p>`;
        return;
    }

    listEl.innerHTML = orcamentosList.map(orc => `
        <div class="orcamento-card">
            <div class="orc-top">
                <div style="display:flex; gap:10px; align-items:center;">
                    ${orc.foto_url ? `<img src="${orc.foto_url}" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid var(--border-subtle);">` : ''}
                    <div>
                        <h3>${orc.projeto}</h3>
                        <span class="orc-client"><i class="ph ph-user"></i> ${orc.cliente}</span>
                    </div>
                </div>
                <span class="status-pill ${orc.status}" title="Clique para alternar status" onclick="window.toggleOrcamentoStatus('${orc.id}')">
                    ${orc.status}
                </span>
            </div>
            <div class="orc-specs">
                <span>${orc.material_nome || 'Filamento'}</span>
                <span>${orc.peso_g}g</span>
                <span>${orc.tempo_horas}h</span>
                <span>${orc.quantidade}x</span>
            </div>
            <div class="orc-bottom">
                <div>
                    <span style="display:block; font-size:0.72rem; color:var(--text-muted);">Custo: ${formatBRL(orc.custo_producao)}</span>
                    <strong>${formatBRL(orc.preco_final)}</strong>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" title="Gerar Imagem do Orçamento" onclick="window.openSavedQuoteImage('${orc.id}')">
                        <i class="ph ph-image"></i>
                    </button>
                    <button class="btn-icon delete" title="Excluir orçamento" onclick="window.deleteOrcamento('${orc.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.openSavedQuoteImage = (id) => {
    const item = orcamentosList.find(o => o.id === id);
    if (item) openQuoteImageModal(item);
};

window.toggleOrcamentoStatus = async (id) => {
    const ordem = ['Pendente', 'Aprovado', 'Recusado'];
    const item = orcamentosList.find(o => o.id === id);
    if (!item) return;

    const nextStatus = ordem[(ordem.indexOf(item.status) + 1) % ordem.length];
    const supabase = getSupabase();

    if (supabase) {
        await supabase.from('orcamentos').update({ status: nextStatus }).eq('id', id);
    } else {
        item.status = nextStatus;
        localStorage.setItem('uruz_orcamentos', JSON.stringify(orcamentosList));
    }

    await loadOrcamentosHistory();
};

window.deleteOrcamento = async (id) => {
    if (!confirm('Remover este orçamento do histórico?')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('orcamentos').delete().eq('id', id);
    } else {
        orcamentosList = orcamentosList.filter(o => o.id !== id);
        localStorage.setItem('uruz_orcamentos', JSON.stringify(orcamentosList));
    }

    await loadOrcamentosHistory();
};

function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}