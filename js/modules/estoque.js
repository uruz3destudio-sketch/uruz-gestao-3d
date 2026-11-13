import { getSupabase } from '../config/supabaseConfig.js';

let insumosList = [];
let editingId = null;

// Dados iniciais de demonstração caso esteja em modo local vazio
const DEMO_INSUMOS = [
    {
        id: '1',
        material: 'PLA+',
        marca: 'ELEGOO Rapid',
        cor: 'Branco',
        cor_hex: '#f4f4f6',
        peso_total_g: 1000,
        peso_atual_g: 820,
        custo_base: 115.00
    },
    {
        id: '2',
        material: 'PLA Silk',
        marca: 'Bambu Lab',
        cor: 'Dourado Metálico',
        cor_hex: '#d49a45',
        peso_total_g: 1000,
        peso_atual_g: 450,
        custo_base: 165.00
    },
    {
        id: '3',
        material: 'PETG',
        marca: '3D Fila',
        cor: 'Preto',
        cor_hex: '#1c1c21',
        peso_total_g: 1000,
        peso_atual_g: 140,
        custo_base: 109.90
    }
];

export async function renderEstoqueModule(container) {
    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-module" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Estoque de Insumos</h1>
                        <p>Gerenciamento de filamentos, resinas e custo base por KG/L</p>
                    </div>
                </div>
                <button class="btn-primary" id="btn-novo-insumo">
                    <i class="ph-bold ph-plus"></i>
                    Novo Insumo
                </button>
            </div>

            <!-- Indicadores Rápidos (KPIs) -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-disc"></i></div>
                    <div class="kpi-data">
                        <span>Rolos / Frascos Cadastrados</span>
                        <strong id="kpi-total-itens">0</strong>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-scales"></i></div>
                    <div class="kpi-data">
                        <span>Material Disponível</span>
                        <strong id="kpi-peso-total">0,00 kg</strong>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon"><i class="ph-duotone ph-currency-circle-dollar"></i></div>
                    <div class="kpi-data">
                        <span>Valor em Estoque</span>
                        <strong id="kpi-valor-total">R$ 0,00</strong>
                    </div>
                </div>
            </div>

            <!-- Filtros e Busca -->
            <div class="filters-bar">
                <div class="search-box">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="search-insumo" placeholder="Buscar por cor, marca ou material...">
                </div>
                <select id="filter-material" class="filter-select">
                    <option value="TODOS">Todos os Materiais</option>
                    <option value="PLA">PLA / PLA+</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS / ASA</option>
                    <option value="TPU">TPU (Flexível)</option>
                    <option value="RESINA">Resina</option>
                </select>
            </div>

            <!-- Listagem dos Insumos -->
            <div class="insumos-grid" id="insumos-grid"></div>
        </div>

        <!-- Modal de Cadastro / Edição -->
        <div class="modal-overlay hidden" id="modal-insumo">
            <div class="modal-box">
                <div class="modal-header">
                    <h2 id="modal-title">Cadastrar Insumo</h2>
                    <button class="btn-icon" id="btn-close-modal"><i class="ph-bold ph-x"></i></button>
                </div>
                <form id="form-insumo">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Material *</label>
                            <select id="inp-material" required>
                                <option value="PLA">PLA</option>
                                <option value="PLA+">PLA+</option>
                                <option value="PLA Silk">PLA Silk</option>
                                <option value="PETG">PETG</option>
                                <option value="ABS">ABS</option>
                                <option value="ASA">ASA</option>
                                <option value="TPU">TPU</option>
                                <option value="Resina">Resina</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Marca *</label>
                            <input type="text" id="inp-marca" placeholder="Ex: ELEGOO, Bambu Lab" required>
                        </div>
                        <div class="form-group full">
                            <label>Cor e Identificação Visual *</label>
                            <div class="color-input-group">
                                <input type="color" id="inp-cor-hex" value="#d49a45" title="Escolha a cor">
                                <input type="text" id="inp-cor" placeholder="Ex: Branco, Preto Fosco, Cinza" style="flex:1" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Peso/Vol. Total (g ou ml) *</label>
                            <input type="number" id="inp-peso-total" value="1000" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Peso/Vol. Atual (g ou ml) *</label>
                            <input type="number" id="inp-peso-atual" value="1000" min="0" required>
                        </div>
                        <div class="form-group full">
                            <label>Custo Base por KG/Litro (R$) *</label>
                            <input type="number" id="inp-custo" step="0.01" placeholder="Ex: 115.00" required>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="btn-cancel-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Insumo</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    bindEvents(container);
    await loadInsumos();
}

function bindEvents(container) {
    // Voltar à tela inicial
    document.getElementById('btn-close-module').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    // Abrir Modal Novo
    document.getElementById('btn-novo-insumo').addEventListener('click', () => openModal());

    // Fechar Modal
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    // Salvar Formulário
    document.getElementById('form-insumo').addEventListener('submit', handleSaveInsumo);

    // Filtros em tempo real
    document.getElementById('search-insumo').addEventListener('input', renderGrid);
    document.getElementById('filter-material').addEventListener('change', renderGrid);
}

async function loadInsumos() {
    const supabase = getSupabase();

    if (supabase) {
        const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            insumosList = data;
        }
    } else {
        // Fallback LocalStorage
        const saved = localStorage.getItem('uruz_insumos');
        insumosList = saved ? JSON.parse(saved) : [...DEMO_INSUMOS];
    }

    updateKPIs();
    renderGrid();
}

function updateKPIs() {
    const totalItens = insumosList.length;
    const pesoTotalG = insumosList.reduce((acc, item) => acc + Number(item.peso_atual_g), 0);
    const valorTotal = insumosList.reduce((acc, item) => {
        const proporcao = Number(item.peso_atual_g) / Number(item.peso_total_g || 1000);
        return acc + (Number(item.custo_base) * proporcao);
    }, 0);

    document.getElementById('kpi-total-itens').textContent = totalItens;
    document.getElementById('kpi-peso-total').textContent = `${(pesoTotalG / 1000).toFixed(2).replace('.', ',')} kg`;
    document.getElementById('kpi-valor-total').textContent = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderGrid() {
    const grid = document.getElementById('insumos-grid');
    const search = document.getElementById('search-insumo').value.toLowerCase();
    const filterMat = document.getElementById('filter-material').value;

    const filtrados = insumosList.filter(item => {
        const matchTexto = item.cor.toLowerCase().includes(search) ||
                           item.marca.toLowerCase().includes(search) ||
                           item.material.toLowerCase().includes(search);
        const matchMat = filterMat === 'TODOS' || item.material.toUpperCase().includes(filterMat);
        return matchTexto && matchMat;
    });

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum insumo encontrado.</p>`;
        return;
    }

    grid.innerHTML = filtrados.map(item => {
        const pct = Math.min(100, Math.max(0, Math.round((item.peso_atual_g / item.peso_total_g) * 100)));
        const isLow = pct <= 20;

        return `
            <div class="insumo-card">
                <div class="insumo-top">
                    <div class="material-badge">
                        <span class="color-swatch" style="background-color: ${item.cor_hex || '#d49a45'}"></span>
                        <span>${item.material} • ${item.cor}</span>
                    </div>
                    <span class="brand-tag">${item.marca}</span>
                </div>

                <div class="stock-progress-wrapper">
                    <div class="stock-numbers">
                        <span>Restante: <strong>${item.peso_atual_g}g</strong> / ${item.peso_total_g}g</span>
                        <span style="color: ${isLow ? 'var(--status-offline)' : 'var(--gold-light)'}">${pct}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${isLow ? 'low' : ''}" style="width: ${pct}%"></div>
                    </div>
                </div>

                <div class="insumo-footer">
                    <div class="cost-info">
                        <span>Custo Base (KG/L)</span>
                        <strong>${Number(item.custo_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" title="Editar" onclick="window.editInsumo('${item.id}')">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon delete" title="Excluir" onclick="window.deleteInsumo('${item.id}')">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openModal(item = null) {
    const modal = document.getElementById('modal-insumo');
    const title = document.getElementById('modal-title');
    
    if (item) {
        editingId = item.id;
        title.textContent = 'Editar Insumo';
        document.getElementById('inp-material').value = item.material;
        document.getElementById('inp-marca').value = item.marca;
        document.getElementById('inp-cor').value = item.cor;
        document.getElementById('inp-cor-hex').value = item.cor_hex || '#d49a45';
        document.getElementById('inp-peso-total').value = item.peso_total_g;
        document.getElementById('inp-peso-atual').value = item.peso_atual_g;
        document.getElementById('inp-custo').value = item.custo_base;
    } else {
        editingId = null;
        title.textContent = 'Cadastrar Insumo';
        document.getElementById('form-insumo').reset();
        document.getElementById('inp-cor-hex').value = '#d49a45';
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-insumo').classList.add('hidden');
    editingId = null;
}

async function handleSaveInsumo(e) {
    e.preventDefault();

    const payload = {
        material: document.getElementById('inp-material').value,
        marca: document.getElementById('inp-marca').value.trim(),
        cor: document.getElementById('inp-cor').value.trim(),
        cor_hex: document.getElementById('inp-cor-hex').value,
        peso_total_g: Number(document.getElementById('inp-peso-total').value),
        peso_atual_g: Number(document.getElementById('inp-peso-atual').value),
        custo_base: Number(document.getElementById('inp-custo').value)
    };

    const supabase = getSupabase();

    if (supabase) {
        if (editingId) {
            await supabase.from('insumos').update(payload).eq('id', editingId);
        } else {
            await supabase.from('insumos').insert([payload]);
        }
    } else {
        if (editingId) {
            insumosList = insumosList.map(i => i.id === editingId ? { ...i, ...payload } : i);
        } else {
            insumosList.unshift({ id: Date.now().toString(), ...payload });
        }
        localStorage.setItem('uruz_insumos', JSON.stringify(insumosList));
    }

    closeModal();
    await loadInsumos();
}

// Funções globais para os botões dos cards
window.editInsumo = (id) => {
    const item = insumosList.find(i => i.id === id);
    if (item) openModal(item);
};

window.deleteInsumo = async (id) => {
    if (!confirm('Deseja realmente remover este insumo do estoque?')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('insumos').delete().eq('id', id);
    } else {
        insumosList = insumosList.filter(i => i.id !== id);
        localStorage.setItem('uruz_insumos', JSON.stringify(insumosList));
    }

    await loadInsumos();
};