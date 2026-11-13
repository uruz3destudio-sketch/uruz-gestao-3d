import { getSupabase } from '../config/supabaseConfig.js';

const SOCIOS = ['José Daniel', 'Gabriel', 'Rodrigo'];
let movimentacoes = [];
let totalVendas = 0;

// Dados de exemplo caso ainda não tenha conectado o Supabase
const DEMO_MOVIMENTACOES = [
    {
        id: '1',
        descricao: 'Venda Inicial / Aporte de Teste',
        valor: 350.00,
        status: 'Pago',
        fonte_pagamento: 'Entrada',
        reembolsado: false
    },
    {
        id: '2',
        descricao: 'Compra Filamento PLA+ Branco',
        valor: 112.86,
        status: 'Pago',
        fonte_pagamento: 'José Daniel',
        reembolsado: false
    },
    {
        id: '3',
        descricao: 'Bico Hardened Steel + Cola Spray',
        valor: 93.90,
        status: 'Pago',
        fonte_pagamento: 'Gabriel',
        reembolsado: false
    },
    {
        id: '4',
        descricao: 'Embalagens e Plástico Bolha',
        valor: 93.90,
        status: 'Pago',
        fonte_pagamento: 'Rodrigo',
        reembolsado: false
    },
    {
        id: '5',
        descricao: 'Fatura Energia + Lote Filamentos',
        valor: 425.00,
        status: 'Pendente',
        fonte_pagamento: 'Caixa',
        reembolsado: false
    }
];

export async function renderCaixaModule(container) {
    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-caixa" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Resumo Financeiro • Caixa Atual</h1>
                        <p>Controle de saldo real, contas pendentes e acerto com os sócios</p>
                    </div>
                </div>
                <button class="btn-primary" id="btn-nova-despesa">
                    <i class="ph-bold ph-plus"></i>
                    Lançar Despesa / Aporte
                </button>
            </div>

            <!-- Cards Superiores: Saldo em Caixa e Contas a Pagar -->
            <div class="caixa-top-grid">
                <div class="caixa-kpi-card saldo">
                    <h3>Saldo em Caixa (Dinheiro Real)</h3>
                    <div class="caixa-kpi-value" id="val-saldo-caixa">R$ 0,00</div>
                    <div class="caixa-kpi-hint">(Vendas + Entradas - Despesas pagas pelo Caixa)</div>
                </div>

                <div class="caixa-kpi-card pendentes">
                    <h3>Contas a Pagar (Pendentes)</h3>
                    <div class="caixa-kpi-value" id="val-contas-pagar">R$ 0,00</div>
                    <div class="caixa-kpi-hint">(Soma das despesas não pagas)</div>
                </div>
            </div>

            <!-- Painel Acerto de Sócios -->
            <div class="socios-panel">
                <div class="socios-header">
                    <h2><i class="ph-duotone ph-handshake"></i> Acerto de Sócios (Investimentos a receber)</h2>
                    <p>Dinheiro que os sócios tiraram do próprio bolso para pagar contas da empresa.</p>
                </div>

                <div class="socios-grid" id="socios-grid"></div>
            </div>

            <!-- Lista de Movimentações / Contas Pendentes e Pagas -->
            <div class="despesas-section">
                <div class="panel-section-title" style="justify-content: space-between;">
                    <span><i class="ph-duotone ph-list-bullets"></i> Lançamentos e Contas Pendentes</span>
                </div>
                <div id="lista-movimentacoes"></div>
            </div>
        </div>

        <!-- Modal de Lançamento -->
        <div class="modal-overlay hidden" id="modal-caixa">
            <div class="modal-box">
                <div class="modal-header">
                    <h2>Novo Lançamento</h2>
                    <button class="btn-icon" id="btn-close-modal-caixa"><i class="ph-bold ph-x"></i></button>
                </div>
                <form id="form-caixa">
                    <div class="form-grid">
                        <div class="form-group full">
                            <label>Descrição *</label>
                            <input type="text" id="cx-descricao" placeholder="Ex: Compra 2kg PLA Preto, Conta de Luz..." required>
                        </div>
                        <div class="form-group">
                            <label>Valor (R$) *</label>
                            <input type="number" id="cx-valor" step="0.01" min="0.01" placeholder="0,00" required>
                        </div>
                        <div class="form-group">
                            <label>Status *</label>
                            <select id="cx-status">
                                <option value="Pendente">Pendente (Conta a Pagar)</option>
                                <option value="Pago">Pago</option>
                            </select>
                        </div>
                        <div class="form-group full">
                            <label>Quem pagou / Origem do Recurso *</label>
                            <select id="cx-fonte">
                                <option value="Caixa">Caixa da Empresa (Saída)</option>
                                <option value="José Daniel">Sócio: José Daniel (Tirou do bolso)</option>
                                <option value="Gabriel">Sócio: Gabriel (Tirou do bolso)</option>
                                <option value="Rodrigo">Sócio: Rodrigo (Tirou do bolso)</option>
                                <option value="Entrada">Entrada Manual no Caixa (+ Saldo)</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="btn-cancel-caixa">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Lançamento</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    bindCaixaEvents(container);
    await loadCaixaData();
}

function bindCaixaEvents(container) {
    document.getElementById('btn-close-caixa').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    const modal = document.getElementById('modal-caixa');
    document.getElementById('btn-nova-despesa').addEventListener('click', () => {
        document.getElementById('form-caixa').reset();
        modal.classList.remove('hidden');
    });

    document.getElementById('btn-close-modal-caixa').addEventListener('click', () => modal.classList.add('hidden'));
    document.getElementById('btn-cancel-caixa').addEventListener('click', () => modal.classList.add('hidden'));

    // Se escolher um sócio, muda status automaticamente para Pago (pois o sócio já pagou a conta)
    document.getElementById('cx-fonte').addEventListener('change', (e) => {
        if (SOCIOS.includes(e.target.value) || e.target.value === 'Entrada') {
            document.getElementById('cx-status').value = 'Pago';
        }
    });

    document.getElementById('form-caixa').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            descricao: document.getElementById('cx-descricao').value.trim(),
            valor: Number(document.getElementById('cx-valor').value),
            status: document.getElementById('cx-status').value,
            fonte_pagamento: document.getElementById('cx-fonte').value,
            reembolsado: false
        };

        const supabase = getSupabase();
        if (supabase) {
            await supabase.from('movimentacoes_financeiras').insert([payload]);
        } else {
            movimentacoes.unshift({ id: Date.now().toString(), ...payload });
            localStorage.setItem('uruz_caixa', JSON.stringify(movimentacoes));
        }

        modal.classList.add('hidden');
        await loadCaixaData();
    });
}

async function loadCaixaData() {
    const supabase = getSupabase();

    if (supabase) {
        const { data } = await supabase
            .from('movimentacoes_financeiras')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) movimentacoes = data;

        // Soma também vendas registradas caso a tabela vendas já exista
        const { data: vendasData } = await supabase.from('vendas').select('valor_total');
        totalVendas = vendasData ? vendasData.reduce((acc, v) => acc + Number(v.valor_total || 0), 0) : 0;
    } else {
        const saved = localStorage.getItem('uruz_caixa');
        movimentacoes = saved ? JSON.parse(saved) : [...DEMO_MOVIMENTACOES];

        const savedVendas = localStorage.getItem('uruz_vendas');
        const vendasArr = savedVendas ? JSON.parse(savedVendas) : [];
        totalVendas = vendasArr.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    }

    renderCalculations();
}

function renderCalculations() {
    // 1. Entradas manuais no caixa
    const entradasManuais = movimentacoes
        .filter(m => m.fonte_pagamento === 'Entrada' && m.status === 'Pago')
        .reduce((acc, m) => acc + Number(m.valor), 0);

    // 2. Despesas pagas diretamente pelo Caixa (incluindo reembolsos já pagos aos sócios)
    const despesasPagasCaixa = movimentacoes
        .filter(m => m.fonte_pagamento === 'Caixa' && m.status === 'Pago')
        .reduce((acc, m) => acc + Number(m.valor), 0);

    // Saldo Real em Caixa = (Vendas + Entradas - Despesas pagas pelo Caixa)
    const saldoReal = (totalVendas + entradasManuais) - despesasPagasCaixa;

    // 3. Contas a Pagar (Pendentes)
    const contasPendentes = movimentacoes
        .filter(m => m.status === 'Pendente')
        .reduce((acc, m) => acc + Number(m.valor), 0);

    document.getElementById('val-saldo-caixa').textContent = formatBRL(saldoReal);
    document.getElementById('val-contas-pagar').textContent = formatBRL(contasPendentes);

    // 4. Acerto de Sócios (Investimentos feitos por cada sócio ainda não reembolsados)
    const sociosGrid = document.getElementById('socios-grid');
    sociosGrid.innerHTML = SOCIOS.map(socio => {
        const valorAReceber = movimentacoes
            .filter(m => m.fonte_pagamento === socio && m.status === 'Pago' && !m.reembolsado)
            .reduce((acc, m) => acc + Number(m.valor), 0);

        const temValor = valorAReceber > 0;

        return `
            <div class="socio-card">
                <div class="socio-name">${socio}</div>
                <div class="socio-amount ${temValor ? '' : 'zerado'}">${formatBRL(valorAReceber)}</div>
                <button class="btn-pagar-socio" ${temValor ? '' : 'disabled'} onclick="window.efetuarPagamentoSocio('${socio}', ${valorAReceber})">
                    <i class="ph-bold ph-credit-card"></i>
                    Efetuar Pagamento
                </button>
            </div>
        `;
    }).join('');

    // 5. Renderiza Lista de Lançamentos
    const listaEl = document.getElementById('lista-movimentacoes');
    if (movimentacoes.length === 0) {
        listaEl.innerHTML = `<p style="color: var(--text-secondary);">Nenhuma movimentação registrada.</p>`;
        return;
    }

    listaEl.innerHTML = movimentacoes.map(m => `
        <div class="despesa-row">
            <div class="despesa-info">
                <strong>${m.descricao}</strong>
                <div class="despesa-meta">
                    <span class="badge-fonte">${m.fonte_pagamento}</span>
                    <span>${m.reembolsado ? 'Reembolsado ao sócio' : m.status}</span>
                </div>
            </div>
            <div class="despesa-right">
                <span class="despesa-valor" style="color: ${m.fonte_pagamento === 'Entrada' ? 'var(--status-online)' : (m.status === 'Pendente' ? 'var(--status-offline)' : 'var(--text-primary)')}">
                    ${m.fonte_pagamento === 'Entrada' ? '+' : '-'} ${formatBRL(m.valor)}
                </span>
                ${m.status === 'Pendente' ? `
                    <button class="btn-icon" title="Dar baixa (Pagar pelo Caixa)" onclick="window.pagarContaPendente('${m.id}')">
                        <i class="ph-bold ph-check" style="color: var(--status-online);"></i>
                    </button>
                ` : ''}
                <button class="btn-icon delete" title="Excluir lançamento" onclick="window.excluirMovimentacao('${m.id}')">
                    <i class="ph ph-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Quita o valor investido pelo sócio: marca os itens dele como reembolsados e registra a saída no Caixa
window.efetuarPagamentoSocio = async (nomeSocio, valorTotal) => {
    if (!confirm(`Confirmar reembolso de ${formatBRL(valorTotal)} para ${nomeSocio}? O valor será descontado do Saldo em Caixa.`)) return;

    const supabase = getSupabase();
    if (supabase) {
        // Marca os investimentos do sócio como reembolsados
        await supabase
            .from('movimentacoes_financeiras')
            .update({ reembolsado: true })
            .eq('fonte_pagamento', nomeSocio)
            .eq('reembolsado', false);

        // Registra a saída do reembolso no Caixa da empresa
        await supabase.from('movimentacoes_financeiras').insert([{
            descricao: `Reembolso Sócio - ${nomeSocio}`,
            valor: valorTotal,
            status: 'Pago',
            fonte_pagamento: 'Caixa',
            reembolsado: true
        }]);
    } else {
        movimentacoes = movimentacoes.map(m =>
            (m.fonte_pagamento === nomeSocio && !m.reembolsado) ? { ...m, reembolsado: true } : m
        );
        movimentacoes.unshift({
            id: Date.now().toString(),
            descricao: `Reembolso Sócio - ${nomeSocio}`,
            valor: valorTotal,
            status: 'Pago',
            fonte_pagamento: 'Caixa',
            reembolsado: true
        });
        localStorage.setItem('uruz_caixa', JSON.stringify(movimentacoes));
    }

    await loadCaixaData();
};

window.pagarContaPendente = async (id) => {
    if (!confirm('Marcar esta conta como PAGA pelo Caixa da empresa?')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase
            .from('movimentacoes_financeiras')
            .update({ status: 'Pago', fonte_pagamento: 'Caixa' })
            .eq('id', id);
    } else {
        movimentacoes = movimentacoes.map(m =>
            m.id === id ? { ...m, status: 'Pago', fonte_pagamento: 'Caixa' } : m
        );
        localStorage.setItem('uruz_caixa', JSON.stringify(movimentacoes));
    }

    await loadCaixaData();
};

window.excluirMovimentacao = async (id) => {
    if (!confirm('Excluir este lançamento?')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('movimentacoes_financeiras').delete().eq('id', id);
    } else {
        movimentacoes = movimentacoes.filter(m => m.id !== id);
        localStorage.setItem('uruz_caixa', JSON.stringify(movimentacoes));
    }

    await loadCaixaData();
};

function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}