import { getSupabase } from '../config/supabaseConfig.js';

let rawVendas = [];
let rawMovimentacoes = [];
let currentPeriod = 'mes_atual';
let chartFluxoInstance = null;
let chartCanaisInstance = null;

const SOCIOS = ['José Daniel', 'Gabriel', 'Rodrigo'];

export async function renderFinanceiroModule(container) {
    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-financeiro" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Fluxo Financeiro</h1>
                        <p>Consolidado de entradas, saídas, desempenho por canal e partilha de lucro</p>
                    </div>
                </div>
            </div>

            <!-- Filtro de Período -->
            <div class="fin-filter-bar">
                <div class="period-pills">
                    <button class="period-btn active" data-period="mes_atual">Mês Atual</button>
                    <button class="period-btn" data-period="30_dias">Últimos 30 Dias</button>
                    <button class="period-btn" data-period="6_meses">Últimos 6 Meses</button>
                    <button class="period-btn" data-period="tudo">Todo o Período</button>
                </div>
                <span style="font-size: 0.82rem; color: var(--text-secondary);" id="fin-period-label">
                    Exibindo dados do mês vigente
                </span>
            </div>

            <!-- 4 KPIs Principais -->
            <div class="fin-kpi-grid">
                <div class="fin-kpi-card">
                    <span><i class="ph-duotone ph-arrow-circle-up-right" style="color: var(--status-online);"></i> Entradas (Receita)</span>
                    <strong id="fin-entradas" style="color: var(--status-online);">R$ 0,00</strong>
                    <small id="fin-qtd-vendas">0 vendas no período</small>
                </div>

                <div class="fin-kpi-card">
                    <span><i class="ph-duotone ph-arrow-circle-down-right" style="color: var(--status-offline);"></i> Saídas Pagas (Despesas)</span>
                    <strong id="fin-saidas" style="color: var(--status-offline);">R$ 0,00</strong>
                    <small>Insumos, energia e reembolsos</small>
                </div>

                <div class="fin-kpi-card">
                    <span><i class="ph-duotone ph-scales" style="color: var(--gold-primary);"></i> Resultado Líquido</span>
                    <strong id="fin-resultado">R$ 0,00</strong>
                    <small id="fin-margem-real">Margem líquida: 0%</small>
                </div>

                <div class="fin-kpi-card">
                    <span><i class="ph-duotone ph-receipt" style="color: var(--gold-light);"></i> Ticket Médio</span>
                    <strong id="fin-ticket">R$ 0,00</strong>
                    <small>Valor médio por pedido</small>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="charts-grid">
                <div class="chart-panel">
                    <div class="panel-section-title">
                        <i class="ph-duotone ph-chart-bar"></i>
                        Entradas vs. Saídas (Últimos 6 Meses)
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="chart-fluxo-mensal"></canvas>
                    </div>
                </div>

                <div class="chart-panel">
                    <div class="panel-section-title">
                        <i class="ph-duotone ph-chart-pie-slice"></i>
                        Faturamento por Canal
                    </div>
                    <div class="chart-canvas-wrapper">
                        <canvas id="chart-canais"></canvas>
                    </div>
                </div>
            </div>

            <!-- Previsão de Divisão de Lucro entre os 3 Sócios -->
            <div class="profit-split-panel">
                <div class="panel-section-title" style="margin-bottom: 0.4rem;">
                    <i class="ph-duotone ph-users-three"></i>
                    Previsão de Partilha de Lucro Líquido (1/3 por Sócio)
                </div>
                <p style="font-size: 0.82rem; color: var(--text-secondary);">
                    Cálculo baseado no resultado líquido positivo do período selecionado (após descontar despesas pagas).
                </p>
                <div class="split-grid" id="fin-split-grid"></div>
            </div>

            <!-- Extrato Unificado -->
            <div class="extrato-panel">
                <div class="panel-section-title">
                    <i class="ph-duotone ph-list-dashes"></i>
                    Extrato Detalhado do Período
                </div>
                <div class="extrato-table-wrap">
                    <table class="extrato-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Tipo</th>
                                <th>Descrição / Cliente</th>
                                <th>Origem / Canal</th>
                                <th style="text-align: right;">Valor</th>
                            </tr>
                        </thead>
                        <tbody id="fin-extrato-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    bindFinanceiroEvents(container);
    await loadFinanceiroData();
}

function bindFinanceiroEvents(container) {
    document.getElementById('btn-close-financeiro').addEventListener('click', () => {
        if (chartFluxoInstance) chartFluxoInstance.destroy();
        if (chartCanaisInstance) chartCanaisInstance.destroy();
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    const periodBtns = container.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.getAttribute('data-period');
            updateDashboard();
        });
    });
}

async function loadFinanceiroData() {
    const supabase = getSupabase();

    if (supabase) {
        const { data: vendas } = await supabase.from('vendas').select('*');
        const { data: movs } = await supabase.from('movimentacoes_financeiras').select('*');
        rawVendas = vendas || [];
        rawMovimentacoes = movs || [];
    } else {
        rawVendas = JSON.parse(localStorage.getItem('uruz_vendas') || '[]');
        rawMovimentacoes = JSON.parse(localStorage.getItem('uruz_caixa') || '[]');
    }

    updateDashboard();
    renderMonthlyChart();
}

function filterByPeriod(dateStr) {
    if (currentPeriod === 'tudo') return true;
    if (!dateStr) return false;

    const itemDate = new Date(dateStr + 'T12:00:00');
    const now = new Date();

    if (currentPeriod === 'mes_atual') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }

    if (currentPeriod === '30_dias') {
        const limit = new Date();
        limit.setDate(now.getDate() - 30);
        return itemDate >= limit;
    }

    if (currentPeriod === '6_meses') {
        const limit = new Date();
        limit.setMonth(now.getMonth() - 6);
        return itemDate >= limit;
    }

    return true;
}

function updateDashboard() {
    const labels = {
        mes_atual: 'Exibindo dados do mês vigente',
        '30_dias': 'Exibindo últimos 30 dias corridos',
        '6_meses': 'Exibindo últimos 6 meses',
        tudo: 'Exibindo todo o histórico registrado'
    };
    document.getElementById('fin-period-label').textContent = labels[currentPeriod];

    // Filtra vendas e movimentações pelo período escolhido
    const vendasFiltradas = rawVendas.filter(v => filterByPeriod(v.data_venda));
    const movsFiltradas = rawMovimentacoes.filter(m => {
        const refDate = m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
        return filterByPeriod(refDate);
    });

    // Soma Entradas (Vendas + Aportes manuais marcados como Entrada)
    const totalVendas = vendasFiltradas.reduce((acc, v) => acc + Number(v.valor_total || 0), 0);
    const totalAportes = movsFiltradas
        .filter(m => m.fonte_pagamento === 'Entrada' && m.status === 'Pago')
        .reduce((acc, m) => acc + Number(m.valor || 0), 0);
    const totalEntradas = totalVendas + totalAportes;

    // Soma Saídas Pagas (Despesas pagas pelo Caixa ou pelos Sócios)
    const totalSaidas = movsFiltradas
        .filter(m => m.fonte_pagamento !== 'Entrada' && m.status === 'Pago' && !m.descricao.startsWith('Reembolso Sócio'))
        .reduce((acc, m) => acc + Number(m.valor || 0), 0);

    const resultadoLiquido = totalEntradas - totalSaidas;
    const margemReal = totalEntradas > 0 ? ((resultadoLiquido / totalEntradas) * 100).toFixed(1) : 0;
    const ticketMedio = vendasFiltradas.length > 0 ? (totalVendas / vendasFiltradas.length) : 0;

    // Atualiza KPIs
    document.getElementById('fin-entradas').textContent = formatBRL(totalEntradas);
    document.getElementById('fin-qtd-vendas').textContent = `${vendasFiltradas.length} venda(s) no período`;
    document.getElementById('fin-saidas').textContent = formatBRL(totalSaidas);

    const resEl = document.getElementById('fin-resultado');
    resEl.textContent = formatBRL(resultadoLiquido);
    resEl.style.color = resultadoLiquido >= 0 ? 'var(--gold-light)' : 'var(--status-offline)';
    document.getElementById('fin-margem-real').textContent = `Margem líquida: ${margemReal}%`;
    document.getElementById('fin-ticket').textContent = formatBRL(ticketMedio);

    // Atualiza Divisão de Lucro (1/3 por sócio)
    const cotaSocio = resultadoLiquido > 0 ? (resultadoLiquido / SOCIOS.length) : 0;
    document.getElementById('fin-split-grid').innerHTML = SOCIOS.map(socio => `
        <div class="split-card">
            <span>${socio}</span>
            <strong>${formatBRL(cotaSocio)}</strong>
        </div>
    `).join('');

    renderChannelsChart(vendasFiltradas);
    renderExtratoTable(vendasFiltradas, movsFiltradas);
}

function renderMonthlyChart() {
    const ctx = document.getElementById('chart-fluxo-mensal');
    if (!ctx || typeof Chart === 'undefined') return;

    if (chartFluxoInstance) chartFluxoInstance.destroy();

    // Gera os rótulos dos últimos 6 meses
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const labels = [];
    const entradasPorMes = [];
    const saidasPorMes = [];

    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mes = d.getMonth();
        const ano = d.getFullYear();
        labels.push(`${mesesNomes[mes]}/${String(ano).slice(-2)}`);

        const somaVendasMes = rawVendas
            .filter(v => {
                if (!v.data_venda) return false;
                const vd = new Date(v.data_venda + 'T12:00:00');
                return vd.getMonth() === mes && vd.getFullYear() === ano;
            })
            .reduce((acc, v) => acc + Number(v.valor_total || 0), 0);

        const somaSaidasMes = rawMovimentacoes
            .filter(m => {
                if (m.fonte_pagamento === 'Entrada' || m.status !== 'Pago' || m.descricao.startsWith('Reembolso Sócio')) return false;
                const md = m.created_at ? new Date(m.created_at) : new Date();
                return md.getMonth() === mes && md.getFullYear() === ano;
            })
            .reduce((acc, m) => acc + Number(m.valor || 0), 0);

        entradasPorMes.push(somaVendasMes);
        saidasPorMes.push(somaSaidasMes);
    }

    chartFluxoInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Entradas (R$)',
                    data: entradasPorMes,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                },
                {
                    label: 'Despesas (R$)',
                    data: saidasPorMes,
                    backgroundColor: '#ef4444',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9a9aa6' } }
            },
            scales: {
                x: { ticks: { color: '#9a9aa6' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#9a9aa6' }, grid: { color: 'rgba(255,255,255,0.06)' } }
            }
        }
    });
}

function renderChannelsChart(vendasFiltradas) {
    const ctx = document.getElementById('chart-canais');
    if (!ctx || typeof Chart === 'undefined') return;

    if (chartCanaisInstance) chartCanaisInstance.destroy();

    const canaisMap = {};
    vendasFiltradas.forEach(v => {
        const canal = v.canal_venda || 'Direto';
        canaisMap[canal] = (canaisMap[canal] || 0) + Number(v.valor_total || 0);
    });

    const labels = Object.keys(canaisMap);
    const values = Object.values(canaisMap);

    chartCanaisInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem vendas'],
            datasets: [{
                data: values.length ? values : [1],
                backgroundColor: values.length
                    ? ['#d49a45', '#10b981', '#c85a17', '#3b82f6', '#8b5cf6']
                    : ['rgba(255,255,255,0.08)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9a9aa6', padding: 14 }
                }
            }
        }
    });
}

function renderExtratoTable(vendasFiltradas, movsFiltradas) {
    const tbody = document.getElementById('fin-extrato-body');
    const lancamentos = [];

    vendasFiltradas.forEach(v => {
        lancamentos.push({
            data: v.data_venda || '',
            tipo: 'entrada',
            descricao: `Venda: ${v.quantidade}x ${v.produto} (${v.cliente})`,
            origem: `${v.canal_venda} • ${v.forma_pagamento}`,
            valor: Number(v.valor_total || 0)
        });
    });

    movsFiltradas
        .filter(m => m.status === 'Pago' && !m.descricao.startsWith('Reembolso Sócio'))
        .forEach(m => {
            const isEntrada = m.fonte_pagamento === 'Entrada';
            const dataStr = m.created_at ? m.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
            lancamentos.push({
                data: dataStr,
                tipo: isEntrada ? 'entrada' : 'saida',
                descricao: m.descricao,
                origem: isEntrada ? 'Aporte / Caixa' : `Pago via ${m.fonte_pagamento}`,
                valor: Number(m.valor || 0)
            });
        });

    lancamentos.sort((a, b) => b.data.localeCompare(a.data));

    if (lancamentos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary); padding: 1.5rem;">Nenhuma movimentação registrada neste período.</td></tr>`;
        return;
    }

    tbody.innerHTML = lancamentos.map(item => `
        <tr>
            <td>${item.data ? item.data.split('-').reverse().join('/') : '-'}</td>
            <td>
                <span class="tipo-tag ${item.tipo}">
                    ${item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
            </td>
            <td>${item.descricao}</td>
            <td style="color: var(--text-secondary);">${item.origem}</td>
            <td style="text-align: right; font-weight: 600; color: ${item.tipo === 'entrada' ? 'var(--status-online)' : 'var(--status-offline)'};">
                ${item.tipo === 'entrada' ? '+' : '-'} ${formatBRL(item.valor)}
            </td>
        </tr>
    `).join('');
}

function formatBRL(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}