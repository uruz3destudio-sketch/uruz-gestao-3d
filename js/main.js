import { initSupabase } from './config/supabaseConfig.js';
import { setupNavigation } from './modules/navigation.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa conexão com o Supabase
    initSupabase();

    // 2. Inicializa eventos de navegação dos menus
    setupNavigation();
});