import { renderEstoqueModule } from './estoque.js';
import { renderOrcamentosModule } from './orcamentos.js';
import { renderCaixaModule } from './caixa.js';
import { renderVendasModule } from './vendas.js';
import { renderFinanceiroModule } from './financeiro.js';
import { renderCatalogoModule } from './catalogo.js';

export function setupNavigation() {
    const menuGrid = document.querySelector('.menu-grid');
    const viewer = document.getElementById('module-viewer');

    if (!menuGrid || !viewer) return;

    menuGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.menu-card');
        if (!card) return;

        event.preventDefault();
        const targetModule = card.getAttribute('data-module');
        openModule(targetModule, viewer);
    });
}

function openModule(moduleName, viewer) {
    viewer.classList.remove('hidden');

    switch (moduleName) {
        case 'estoque':
            renderEstoqueModule(viewer);
            break;
        case 'orcamentos':
            renderOrcamentosModule(viewer);
            break;
        case 'caixa':
            renderCaixaModule(viewer);
            break;
        case 'vendas':
            renderVendasModule(viewer);
            break;
        case 'financeiro':
            renderFinanceiroModule(viewer);
            break;
        case 'catalogo':
            renderCatalogoModule(viewer);
            break;
        default:
            viewer.classList.add('hidden');
    }
}