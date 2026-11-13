import { getSupabase } from '../config/supabaseConfig.js';

let vendasList = [];
let insumosCache = [];
let orcamentosCache = [];

export async function renderVendasModule(container) {
    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-vendas" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Registro de Vendas</h1>
                        <p>Histórico de pedidos, faturamento e baixa automática de filamentos</p>
                    </div>
                </div>
                <button class="btn-primary" id="btn-nova-venda">
                    <i class="ph-bold ph-plus"></i>
                    Registrar Venda
                </button>
            </div>

            <!-- Indicadores de Vendas -->
            <div class="vendas-kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-shopping-bag"></i></div>
                    <div class="kpi-data">
                        <span>Pedidos Realizados</span>
                        <strong id="kpi-vendas-qtd">0</strong>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-currency-dollar"></i></div>
                    <div class="kpi-data">
                        <span>Faturamento Bruto</span>
                        <strong id="kpi-vendas-faturamento">R$ 0,00</strong>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-trend-up"></i></div>
                    <div class="kpi-data">
                        <span>Lucro Líquido Estimado</span>
                        <strong id="kpi-vendas-lucro" style="color: var(--status-online);">R$ 0,00</strong>
                    </div>
                </div>
            </div>

            <!-- Barra de Busca -->
            <div class="filters-bar">
                <div class="search-box">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="search-venda" placeholder="Buscar por cliente, peça ou canal...">
                </div>
                <select id="filter-canal" class="filter-select">
                    <option value="TODOS">Todos os Canais</option>
                    <option value="WhatsApp / Direto">WhatsApp / Direto</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Shopee">Shopee</option>
                    <option value="Mercado Livre">Mercado Livre</option>
                    <option value="Presencial">Presencial</option>
                </select>
            </div>

            <!-- Lista de Vendas -->
            <div class="vendas-list" id="vendas-list"></div>
        </div>

        <!-- Modal de Nova Venda -->
        <div class="modal-overlay hidden" id="modal-venda">
            <div class="modal-box modal-venda-box">
                <div class="modal-header">
                    <h2>Registrar Nova Venda</h2>
                    <button class="btn-icon" id="btn-close-modal-venda"><i class="ph-bold ph-x"></i></button>
                </div>

                <!-- Atalho: Importar dados de um Orçamento Salvo -->
                <div class="import-quote-bar">
                    <label><i class="ph-bold ph-magic-wand"></i> Preencher a partir de um Orçamento Salvo (Opcional)</label>
                    <select id="vnd-import-orcamento">
                        <option value="">-- Lançamento Manual --</option>
                    </select>
                </div>

                <form id="form-venda">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Cliente *</label>
                            <input type="text" id="vnd-cliente" placeholder="Nome do cliente" required>
                        </div>
                        <div class="form-group">
                            <label>Data da Venda *</label>
                            <input type="date" id="vnd-data" required>
                        </div>
                        <div class="form-group full">
                            <label>Peça / Produto Vendido *</label>
                            <input type="text" id="vnd-produto" placeholder="Ex: Action Figure Chun-Li 22cm" required>
                        </div>
                        <div class="form-group">
                            <label>Canal de Venda</label>
                            <select id="vnd-canal">
                                <option value="WhatsApp / Direto">WhatsApp / Direto</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Shopee">Shopee</option>
                                <option value="Mercado Livre">Mercado Livre</option>
                                <option value="Presencial">Presencial</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Forma de Pagamento</label>
                            <select id="vnd-pagamento">
                                <option value="Pix">Pix</option>
                                <option value="Cartão Crédito">Cartão Crédito</option>
                                <option value="Cartão Débito">Cartão Débito</option>
                                <option value="Dinheiro">Dinheiro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantidade *</label>
                            <input type="number" id="vnd-qtd" value="1" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Valor Total Recebido (R$) *</label>
                            <input type="number" id="vnd-valor" step="0.01" min="0.01" placeholder="0,00" required>
                        </div>
                        <div class="form-group full">
                            <label>Custo Total de Produção (R$)</label>
                            <input type="number" id="vnd-custo" step="0.01" min="0" value="0" placeholder="Para cálculo de lucro">
                        </div>
                    </div>

                    <!-- Baixa Automática de Estoque -->
                    <div class="stock-deduct-box">
                        <label class="checkbox-row">
                            <input type="checkbox" id="chk-baixar-estoque" checked>
                            <span>Descontar filamento gasto automaticamente do Estoque</span>
                        </label>
                        <div id="venda-filamentos-list" class="filamentos-container" style="margin-bottom: 0.5rem;"></div>
                        <button type="button" class="btn-add-filament" id="btn-vnd-add-fil" style="margin-bottom: 0;">
                            <i class="ph-bold ph-plus"></i> Adicionar Cor/Filamento Gasto
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="btn-cancel-venda">Cancelar</button>
                        <button type="submit" class="btn-primary">Confirmar Venda</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadAuxData();
    bindVendasEvents(container);
    await loadVendas();
}

async function loadAuxData() {
    const supabase = getSupabase();

    if (supabase) {
        const { data: ins } = await supabase.from('insumos').select('*').order('material');
        if (ins) insumosCache = ins;

        const { data: orcs } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false });
        if (orcs) orcamentosCache = orcs;
    } else {
        insumosCache = JSON.parse(localStorage.getItem('uruz_insumos') || '[]');
        orcamentosCache = JSON.parse(localStorage.getItem('uruz_orcamentos') || '[]');
    }
}

function buildInsumoSelectOptions() {
    if (insumosCache.length === 0) {
        return `<option value="">Nenhum insumo cadastrado no estoque</option>`;
    }
    return `<option value="">-- Selecione o rolo --</option>` + insumosCache.map(item => `
        <option value="${item.id}" data-nome="${item.material} ${item.cor}">
            ${item.material} • ${item.cor} (${item.marca}) — Restam ${item.peso_atual_g}g
        </option>
    `).join('');
}

function addVendaFilamentRow(insumoId = '', pesoG = '') {
    const list = document.getElementById('venda-filamentos-list');
    const row = document.createElement('div');
    row.className = 'filamento-row';

    row.innerHTML = `
        <select class="vnd-fil-select">
            ${buildInsumoSelectOptions()}
        </select>
        <input type="number" class="vnd-fil-peso" value="${pesoG}" min="0" step="0.1" placeholder="Gasto (g)">
        <button type="button" class="btn-icon delete btn-rm-vnd-fil" title="Remover">
            <i class="ph ph-trash"></i>
        </button>
    `;

    if (insumoId) {
        row.querySelector('.vnd-fil-select').value = insumoId;
    }

    row.querySelector('.btn-rm-vnd-fil').addEventListener('click', () => row.remove());
    list.appendChild(row);
}

function bindVendasEvents(container) {
    document.getElementById('btn-close-vendas').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    const modal = document.getElementById('modal-venda');

    // Abrir Modal Nova Venda
    document.getElementById('btn-nova-venda').addEventListener('click', () => {
        document.getElementById('form-venda').reset();
        document.getElementById('vnd-data').value = new Date().toISOString().split('T')[0];

        // Popula select de orçamentos salvos
        const impSelect = document.getElementById('vnd-import-orcamento');
        impSelect.innerHTML = `<option value="">-- Lançamento Manual --</option>` + orcamentosCache.map(o => `
            <option value="${o.id}">${o.cliente} — ${o.projeto} (${formatBRL(o.preco_final)})</option>
        `).join('');

        // Reseta lista de filamentos para baixa
        const filList = document.getElementById('venda-filamentos-list');
        filList.innerHTML = '';
        addVendaFilamentRow();

        modal.classList.remove('hidden');
    });

    document.getElementById('btn-close-modal-venda').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-cancel-venda').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-vnd-add-fil').addEventListener('click', () => addVendaFilamentRow());

    // Checkbox ativa/desativa seção de filamentos
    document.getElementById('chk-baixar-estoque').addEventListener('change', (e) => {
        const display = e.target.checked ? '' : 'none';
        document.getElementById('venda-filamentos-list').style.display = display;
        document.getElementById('btn-vnd-add-fil').style.display = display;
    });

    // Importar dados automaticamente ao escolher um orçamento
    document.getElementById('vnd-import-orcamento').addEventListener('change', (e) => {
        const orcId = e.target.value;
        const filList = document.getElementById('venda-filamentos-list');
        filList.innerHTML = '';

        if (!orcId) {
            addVendaFilamentRow();
            return;
        }

        const orc = orcamentosCache.find(o => o.id === orcId);
        if (!orc) return;

        document.getElementById('vnd-cliente').value = orc.cliente;
        document.getElementById('vnd-produto').value = orc.projeto;
        document.getElementById('vnd-qtd').value = orc.quantidade || 1;
        document.getElementById('vnd-valor').value = Number(orc.preco_final).toFixed(2);
        document.getElementById('vnd-custo').value = Number(orc.custo_producao).toFixed(2);

        // Preenche os filamentos usados no orçamento
        if (orc.filamentos_json && orc.filamentos_json.length > 0) {
            orc.filamentos_json.forEach(f => {
                const pesoTotalLote = Number(f.peso_g) * Number(orc.quantidade || 1);
                addVendaFilamentRow(f.insumo_id || '', pesoTotalLote);
            });
        } else {
            addVendaFilamentRow(orc.insumo_id || '', orc.peso_g || '');
        }
    });

    // Salvar Venda + Baixar Estoque
    document.getElementById('form-venda').addEventListener('submit', handleSaveVenda);

    // Filtros
    document.getElementById('search-venda').addEventListener('input', renderVendasList);
    document.getElementById('filter-canal').addEventListener('change', renderVendasList);
}

async function handleSaveVenda(e) {
    e.preventDefault();

    const baixarEstoque = document.getElementById('chk-baixar-estoque').checked;
    const filamentosParaBaixar = [];

    if (baixarEstoque) {
        document.querySelectorAll('#venda-filamentos-list .filamento-row').forEach(row => {
            const sel = row.querySelector('.vnd-fil-select');
            const peso = Number(row.querySelector('.vnd-fil-peso').value) || 0;
            if (sel.value && peso > 0) {
                const opt = sel.options[sel.selectedIndex];
                filamentosParaBaixar.push({
                    insumo_id: sel.value,
                    nome: opt ? opt.getAttribute('data-nome') : 'Filamento',
                    peso_g: peso
                });
            }
        });
    }

    const payload = {
        cliente: document.getElementById('vnd-cliente').value.trim(),
        data_venda: document.getElementById('vnd-data').value,
        produto: document.getElementById('vnd-produto').value.trim(),
        canal_venda: document.getElementById('vnd-canal').value,
        forma_pagamento: document.getElementById('vnd-pagamento').value,
        quantidade: Number(document.getElementById('vnd-qtd').value) || 1,
        valor_total: Number(document.getElementById('vnd-valor').value),
        custo_estimado: Number(document.getElementById('vnd-custo').value) || 0,
        filamentos_baixados: filamentosParaBaixar
    };

    const importedOrcId = document.getElementById('vnd-import-orcamento').value;
    const supabase = getSupabase();

    if (supabase) {
        const { error } = await supabase.from('vendas').insert([payload]);
        if (error) {
            console.error(error);
            alert('Erro ao registrar venda no Supabase.');
            return;
        }

        // Atualiza peso atual de cada filamento no Estoque
        for (const item of filamentosParaBaixar) {
            const insumo = insumosCache.find(i => i.id === item.insumo_id);
            if (insumo) {
                const novoPeso = Math.max(0, Number(insumo.peso_atual_g) - item.peso_g);
                await supabase.from('insumos').update({ peso_atual_g: novoPeso }).eq('id', item.insumo_id);
            }
        }

        // Marca orçamento importado como Aprovado
        if (importedOrcId) {
            await supabase.from('orcamentos').update({ status: 'Aprovado' }).eq('id', importedOrcId);
        }
    } else {
        vendasList.unshift({ id: Date.now().toString(), ...payload });
        localStorage.setItem('uruz_vendas', JSON.stringify(vendasList));

        // Atualiza estoque local
        filamentosParaBaixar.forEach(item => {
            const insumo = insumosCache.find(i => i.id === item.insumo_id);
            if (insumo) {
                insumo.peso_atual_g = Math.max(0, Number(insumo.peso_atual_g) - item.peso_g);
            }
        });
        localStorage.setItem('uruz_insumos', JSON.stringify(insumosCache));

        if (importedOrcId) {
            orcamentosCache = orcamentosCache.map(o => o.id === importedOrcId ? { ...o, status: 'Aprovado' } : o);
            localStorage.setItem('uruz_orcamentos', JSON.stringify(orcamentosCache));
        }
    }

    document.getElementById('modal-venda').classList.add('hidden');
    await loadAuxData();
    await loadVendas();
}

async function loadVendas() {
    const supabase = getSupabase();
    if (supabase) {
        const { data } = await supabase
            .from('vendas')
            .select('*')
            .order('data_venda', { ascending: false });
        if (data) vendasList = data;
    } else {
        vendasList = JSON.parse(localStorage.getItem('uruz_vendas') || '[]');
    }

    updateVendasKPIs();
    renderVendasList();
}

function updateVendasKPIs() {
    const qtd = vendasList.length;
    const faturamento = vendasList.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const custoTotal = vendasList.reduce((acc, v) => acc + Number(v.custo_estimado || 0), 0);
    const lucro = faturamento - custoTotal;

    document.getElementById('kpi-vendas-qtd').textContent = qtd;
    document.getElementById('kpi-vendas-faturamento').textContent = formatBRL(faturamento);
    document.getElementById('kpi-vendas-lucro').textContent = formatBRL(lucro);
}

function renderVendasList() {
    const listEl = document.getElementById('vendas-list');
    const search = document.getElementById('search-venda').value.toLowerCase();
    const canalFilter = document.getElementById('filter-canal').value;

    const filtradas = vendasList.filter(v => {
        const matchTexto = v.cliente.toLowerCase().includes(search) ||
                           v.produto.toLowerCase().includes(search);
        const matchCanal = canalFilter === 'TODOS' || v.canal_venda === canalFilter;
        return matchTexto && matchCanal;
    });

    if (filtradas.length === 0) {
        listEl.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Nenhuma venda registrada.</p>`;
        return;
    }

    listEl.innerHTML = filtradas.map(v => {
        const dataFormatada = v.data_venda ? v.data_venda.split('-').reverse().join('/') : '-';
        const lucroItem = Number(v.valor_total) - Number(v.custo_estimado || 0);
        const resumoFil = (v.filamentos_baixados && v.filamentos_baixados.length > 0)
            ? v.filamentos_baixados.map(f => `${f.nome} (-${f.peso_g}g)`).join(', ')
            : '';

        return `
            <div class="venda-card">
                <div class="venda-main-info">
                    <div class="venda-title-row">
                        <h3>${v.quantidade}x ${v.produto}</h3>
                        <span class="canal-badge">${v.canal_venda}</span>
                        <span class="pag-badge">${v.forma_pagamento}</span>
                    </div>
                    <div class="venda-sub-info">
                        <span><i class="ph ph-user"></i> ${v.cliente}</span>
                        <span><i class="ph ph-calendar-blank"></i> ${dataFormatada}</span>
                        ${resumoFil ? `<span style="color: var(--gold-primary);"><i class="ph ph-spool"></i> Estoque: ${resumoFil}</span>` : ''}
                    </div>
                </div>

                <div class="venda-values-box">
                    <div class="venda-price-group">
                        <strong>${formatBRL(v.valor_total)}</strong>
                        <span>Lucro est.: ${formatBRL(lucroItem)}</span>
                    </div>
                    <button class="btn-icon delete" title="Excluir venda" onclick="window.deleteVenda('${v.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.deleteVenda = async (id) => {
    if (!confirm('Deseja excluir este registro de venda? (O valor será abatido do Saldo em Caixa)')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('vendas').delete().eq('id', id);
    } else {
        vendasList = vendasList.filter(v => v.id !== id);
        localStorage.setItem('uruz_vendas', JSON.stringify(vendasList));
    }

    await loadVendas();
};

function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}