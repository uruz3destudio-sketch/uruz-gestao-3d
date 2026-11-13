import { getSupabase } from '../config/supabaseConfig.js';
import { renderOrcamentosModule } from './orcamentos.js';

let modelosList = [];
let editingModeloId = null;
let modeloPhotoBase64 = null;

const DEMO_MODELOS = [
    {
        id: '1',
        nome: 'Action Figure Chun-Li (22cm)',
        categoria: 'Action Figures',
        material_recomendado: 'PLA+ Branco',
        peso_estimado_g: 185,
        tempo_estimado_h: 9.5,
        preco_sugerido: 145.00,
        parametros_slicer: 'Camada 0.16mm • 15% Gyroid • Suporte Árvore (Orgânico) • Bambu Lab A1',
        link_arquivo: 'SD Card / Projetos / ChunLi_v2.3mf',
        foto_url: null
    }
];

export async function renderCatalogoModule(container) {
    container.innerHTML = `
        <div class="module-container">
            <!-- Cabeçalho -->
            <div class="module-header">
                <div class="header-left">
                    <button class="btn-back" id="btn-close-catalogo" title="Voltar ao Menu">
                        <i class="ph-bold ph-arrow-left"></i>
                    </button>
                    <div class="module-title-group">
                        <h1>Catálogo de Modelos</h1>
                        <p>Biblioteca de arquivos STL/3MF, parâmetros de fatiamento e referência rápida</p>
                    </div>
                </div>
                <button class="btn-primary" id="btn-novo-modelo">
                    <i class="ph-bold ph-plus"></i>
                    Cadastrar Modelo
                </button>
            </div>

            <!-- Barra de Filtros -->
            <div class="filters-bar">
                <div class="search-box">
                    <i class="ph ph-magnifying-glass"></i>
                    <input type="text" id="search-modelo" placeholder="Buscar modelo por nome, material ou parâmetro...">
                </div>
                <select id="filter-cat-modelo" class="filter-select">
                    <option value="TODOS">Todas as Categorias</option>
                    <option value="Action Figures">Action Figures</option>
                    <option value="Peças Automotivas">Peças Automotivas</option>
                    <option value="Utilitários">Utilitários</option>
                    <option value="Decoração">Decoração</option>
                    <option value="Personalizados">Personalizados</option>
                </select>
            </div>

            <!-- Vitrine de Modelos -->
            <div class="catalogo-grid" id="catalogo-grid"></div>
        </div>

        <!-- Modal de Cadastro / Edição de Modelo -->
        <div class="modal-overlay hidden" id="modal-modelo">
            <div class="modal-box modal-venda-box">
                <div class="modal-header">
                    <h2 id="modal-modelo-title">Cadastrar Modelo 3D</h2>
                    <button class="btn-icon" id="btn-close-modal-modelo"><i class="ph-bold ph-x"></i></button>
                </div>

                <form id="form-modelo">
                    <!-- Upload de Foto -->
                    <label class="photo-upload-box" for="mod-foto-input" style="margin-bottom: 1.1rem;">
                        <div class="photo-preview-thumb" id="mod-foto-preview">
                            <i class="ph-duotone ph-camera-plus"></i>
                        </div>
                        <div class="photo-upload-info">
                            <strong id="mod-foto-label">Foto do Modelo ou Render (Opcional)</strong>
                            <span>Clique para anexar imagem da peça finalizada</span>
                        </div>
                        <input type="file" id="mod-foto-input" accept="image/*" hidden>
                    </label>

                    <div class="form-grid">
                        <div class="form-group full">
                            <label>Nome do Modelo / Projeto *</label>
                            <input type="text" id="mod-nome" placeholder="Ex: Action Figure Chun-Li 22cm" required>
                        </div>
                        <div class="form-group">
                            <label>Categoria</label>
                            <select id="mod-categoria">
                                <option value="Action Figures">Action Figures</option>
                                <option value="Peças Automotivas">Peças Automotivas</option>
                                <option value="Utilitários">Utilitários</option>
                                <option value="Decoração">Decoração</option>
                                <option value="Personalizados">Personalizados</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Material Recomendado</label>
                            <input type="text" id="mod-material" placeholder="Ex: PLA+ Branco, PETG" value="PLA+">
                        </div>
                        <div class="form-group">
                            <label>Peso Estimado (g) *</label>
                            <input type="number" id="mod-peso" step="0.1" min="1" placeholder="Ex: 120" required>
                        </div>
                        <div class="form-group">
                            <label>Tempo de Impressão (h) *</label>
                            <input type="number" id="mod-horas" step="0.1" min="0.1" placeholder="Ex: 5.5" required>
                        </div>
                        <div class="form-group">
                            <label>Preço Base Sugerido (R$)</label>
                            <input type="number" id="mod-preco" step="0.01" min="0" placeholder="0,00">
                        </div>
                        <div class="form-group">
                            <label>Local / Link do Arquivo STL/3MF</label>
                            <input type="text" id="mod-link" placeholder="Ex: Pasta STL/Figures ou URL">
                        </div>
                        <div class="form-group full">
                            <label>Parâmetros de Fatiamento (Bambu Studio / Slicer)</label>
                            <input type="text" id="mod-slicer" placeholder="Ex: Camada 0.16mm • 15% Gyroid • Suporte Árvore">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="btn-cancel-modelo">Cancelar</button>
                        <button type="submit" class="btn-primary">Salvar Modelo</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    bindCatalogoEvents(container);
    await loadModelos();
}

function bindCatalogoEvents(container) {
    document.getElementById('btn-close-catalogo').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
    });

    document.getElementById('btn-novo-modelo').addEventListener('click', () => openModeloModal());
    document.getElementById('btn-close-modal-modelo').addEventListener('click', closeModeloModal);
    document.getElementById('btn-cancel-modelo').addEventListener('click', closeModeloModal);

    // Upload e compressão de foto
    document.getElementById('mod-foto-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
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
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                modeloPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);

                document.getElementById('mod-foto-preview').innerHTML = `<img src="${modeloPhotoBase64}" alt="Preview">`;
                document.getElementById('mod-foto-label').textContent = `Foto selecionada: ${file.name}`;
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('form-modelo').addEventListener('submit', handleSaveModelo);
    document.getElementById('search-modelo').addEventListener('input', renderCatalogoGrid);
    document.getElementById('filter-cat-modelo').addEventListener('change', renderCatalogoGrid);
}

async function loadModelos() {
    const supabase = getSupabase();
    if (supabase) {
        const { data } = await supabase
            .from('catalogo_modelos')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) modelosList = data;
    } else {
        const saved = localStorage.getItem('uruz_catalogo');
        modelosList = saved ? JSON.parse(saved) : [...DEMO_MODELOS];
    }

    renderCatalogoGrid();
}

function renderCatalogoGrid() {
    const grid = document.getElementById('catalogo-grid');
    const search = document.getElementById('search-modelo').value.toLowerCase();
    const catFilter = document.getElementById('filter-cat-modelo').value;

    const filtrados = modelosList.filter(m => {
        const matchTexto = m.nome.toLowerCase().includes(search) ||
                           (m.material_recomendado || '').toLowerCase().includes(search) ||
                           (m.parametros_slicer || '').toLowerCase().includes(search);
        const matchCat = catFilter === 'TODOS' || m.categoria === catFilter;
        return matchTexto && matchCat;
    });

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">Nenhum modelo encontrado no catálogo.</p>`;
        return;
    }

    grid.innerHTML = filtrados.map(m => `
        <div class="modelo-card">
            <div class="modelo-cover">
                <span class="modelo-cat-badge">${m.categoria}</span>
                ${m.foto_url
                    ? `<img src="${m.foto_url}" alt="${m.nome}">`
                    : `<i class="ph-duotone ph-cube modelo-placeholder-icon"></i>`
                }
            </div>

            <div class="modelo-body">
                <h3>${m.nome}</h3>

                <div class="modelo-specs-bar">
                    <div class="spec-mini">
                        <span>Material</span>
                        <strong>${m.material_recomendado || '-'}</strong>
                    </div>
                    <div class="spec-mini">
                        <span>Peso</span>
                        <strong>${m.peso_estimado_g}g</strong>
                    </div>
                    <div class="spec-mini">
                        <span>Tempo</span>
                        <strong>${m.tempo_estimado_h}h</strong>
                    </div>
                </div>

                ${m.parametros_slicer ? `
                    <div class="slicer-notes">
                        <i class="ph-bold ph-sliders-horizontal" style="color: var(--gold-primary);"></i>
                        ${m.parametros_slicer}
                    </div>
                ` : ''}

                ${m.link_arquivo ? `
                    <div style="font-size: 0.76rem; color: var(--text-muted); word-break: break-all;">
                        <i class="ph ph-folder-open"></i> ${m.link_arquivo}
                    </div>
                ` : ''}

                <div class="modelo-footer">
                    <button class="btn-quote-model" onclick="window.orcarDoCatalogo('${m.id}')">
                        <i class="ph-bold ph-calculator"></i>
                        Orçar Peça
                    </button>

                    <div class="card-actions">
                        <button class="btn-icon" title="Editar Modelo" onclick="window.editModelo('${m.id}')">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon delete" title="Excluir Modelo" onclick="window.deleteModelo('${m.id}')">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openModeloModal(modelo = null) {
    const modal = document.getElementById('modal-modelo');
    const title = document.getElementById('modal-modelo-title');

    if (modelo) {
        editingModeloId = modelo.id;
        modeloPhotoBase64 = modelo.foto_url || null;
        title.textContent = 'Editar Modelo 3D';
        document.getElementById('mod-nome').value = modelo.nome;
        document.getElementById('mod-categoria').value = modelo.categoria;
        document.getElementById('mod-material').value = modelo.material_recomendado || '';
        document.getElementById('mod-peso').value = modelo.peso_estimado_g;
        document.getElementById('mod-horas').value = modelo.tempo_estimado_h;
        document.getElementById('mod-preco').value = modelo.preco_sugerido || '';
        document.getElementById('mod-link').value = modelo.link_arquivo || '';
        document.getElementById('mod-slicer').value = modelo.parametros_slicer || '';

        if (modelo.foto_url) {
            document.getElementById('mod-foto-preview').innerHTML = `<img src="${modelo.foto_url}" alt="Preview">`;
            document.getElementById('mod-foto-label').textContent = 'Foto atual carregada (clique para trocar)';
        } else {
            document.getElementById('mod-foto-preview').innerHTML = `<i class="ph-duotone ph-camera-plus"></i>`;
            document.getElementById('mod-foto-label').textContent = 'Foto do Modelo ou Render (Opcional)';
        }
    } else {
        editingModeloId = null;
        modeloPhotoBase64 = null;
        title.textContent = 'Cadastrar Modelo 3D';
        document.getElementById('form-modelo').reset();
        document.getElementById('mod-foto-preview').innerHTML = `<i class="ph-duotone ph-camera-plus"></i>`;
        document.getElementById('mod-foto-label').textContent = 'Foto do Modelo ou Render (Opcional)';
    }

    modal.classList.remove('hidden');
}

function closeModeloModal() {
    document.getElementById('modal-modelo').classList.add('hidden');
    editingModeloId = null;
    modeloPhotoBase64 = null;
}

async function handleSaveModelo(e) {
    e.preventDefault();

    const payload = {
        nome: document.getElementById('mod-nome').value.trim(),
        categoria: document.getElementById('mod-categoria').value,
        material_recomendado: document.getElementById('mod-material').value.trim(),
        peso_estimado_g: Number(document.getElementById('mod-peso').value),
        tempo_estimado_h: Number(document.getElementById('mod-horas').value),
        preco_sugerido: Number(document.getElementById('mod-preco').value) || 0,
        link_arquivo: document.getElementById('mod-link').value.trim(),
        parametros_slicer: document.getElementById('mod-slicer').value.trim(),
        foto_url: modeloPhotoBase64
    };

    const supabase = getSupabase();
    if (supabase) {
        if (editingModeloId) {
            await supabase.from('catalogo_modelos').update(payload).eq('id', editingModeloId);
        } else {
            await supabase.from('catalogo_modelos').insert([payload]);
        }
    } else {
        if (editingModeloId) {
            modelosList = modelosList.map(m => m.id === editingModeloId ? { ...m, ...payload } : m);
        } else {
            modelosList.unshift({ id: Date.now().toString(), ...payload });
        }
        localStorage.setItem('uruz_catalogo', JSON.stringify(modelosList));
    }

    closeModeloModal();
    await loadModelos();
}

// Abre a Calculadora de Orçamentos já preenchida com os dados do modelo escolhido
window.orcarDoCatalogo = async (id) => {
    const modelo = modelosList.find(m => m.id === id);
    if (!modelo) return;

    const viewer = document.getElementById('module-viewer');
    await renderOrcamentosModule(viewer);

    document.getElementById('orc-projeto').value = modelo.nome;
    document.getElementById('orc-horas').value = modelo.tempo_estimado_h;
    const firstWeightInput = document.querySelector('.fil-peso');
    if (firstWeightInput) {
        firstWeightInput.value = modelo.peso_estimado_g;
        firstWeightInput.dispatchEvent(new Event('input'));
    }
};

window.editModelo = (id) => {
    const item = modelosList.find(m => m.id === id);
    if (item) openModeloModal(item);
};

window.deleteModelo = async (id) => {
    if (!confirm('Remover este modelo do catálogo?')) return;

    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('catalogo_modelos').delete().eq('id', id);
    } else {
        modelosList = modelosList.filter(m => m.id !== id);
        localStorage.setItem('uruz_catalogo', JSON.stringify(modelosList));
    }

    await loadModelos();
};