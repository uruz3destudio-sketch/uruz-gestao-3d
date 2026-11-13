// Configurações de conexão com o Supabase
const SUPABASE_URL = 'https://rkjpzqkhxrajxyskxezy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yOuGPZXAIcUME4bX3BUJ9w_-rtWPwnm';

let supabaseClient = null;

export function initSupabase() {
    const statusBadge = document.getElementById('supabase-status');
    const statusDot = statusBadge.querySelector('.status-dot');
    const statusText = statusBadge.querySelector('.status-text');

    try {
        // Verifica se as chaves foram preenchidas
        if (SUPABASE_URL.includes('SUA_SUPABASE') || SUPABASE_ANON_KEY.includes('SUA_SUPABASE')) {
            statusText.textContent = 'Modo Local (Configure o Supabase)';
            return null;
        }

        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        statusDot.classList.add('online');
        statusText.textContent = 'Supabase Conectado';
        return supabaseClient;
    } catch (error) {
        console.error('Erro ao conectar ao Supabase:', error);
        statusText.textContent = 'Erro na conexão';
        return null;
    }
}

export function getSupabase() {
    return supabaseClient;
}