import { firebaseConfig } from './js/constants.js';
import { state, loadStateFromLocalStorage, saveData } from './js/state.js';
import { renderProfileTabs, updateActiveProfileUI, renderGroupTabs, renderMatches, updateLiveCalculations } from './js/components/index.js';
import { setupEventListeners } from './js/events.js';
import { checkAndFetchApiResults, updateApiStatusUI } from './js/api.js';

// Inicializar Firebase
window.firebase.initializeApp(firebaseConfig);
const db = window.firebase.database();

// --- INICIALIZACIÓN ---
// python -m http.server 8000
// https://web-mundial-lake.vercel.app/?admin=true 
// npx vercel --prod
async function initApp() {
    try {
        const cached = localStorage.getItem('wc2026_api_matches');
        if (cached) state.apiMatchesList = JSON.parse(cached);
    } catch (e) {
        console.error("Error al cargar caché de partidos:", e);
    }

    // 1. Determinar rol a partir del parámetro de URL (?admin=true o ?role=admin) o de LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin') || urlParams.get('role') === 'admin') {
        state.userRole = 'admin';
        localStorage.setItem('wc2026_role', 'admin');
    } else if (urlParams.get('admin') === 'false' || urlParams.get('role') === 'user') {
        state.userRole = 'user';
        localStorage.setItem('wc2026_role', 'user');
    } else {
        state.userRole = localStorage.getItem('wc2026_role') || 'user';
    }

    // 2. Cargar JSON local como respaldo de inicialización si Firebase estuviese vacío
    let localBackup = null;
    try {
        const response = await fetch('predicciones_mundial2026.json');
        localBackup = await response.json();
    } catch (e) {
        console.error("Error al cargar predicciones locales de respaldo:", e);
    }

    // 3. Cargar datos en tiempo real de Firebase
    db.ref('mundial_data').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.profiles = data.profiles || [];
            state.realResults = data.realResults || {};
            state.apiToken = data.apiToken || "";
            state.lastApiFetchTime = data.lastApiFetchTime || 0;
            state.apiSyncStatus = data.apiSyncStatus || "Sincronizado";
            updateApiStatusUI();
        } else if (localBackup) {
            state.profiles = localBackup.profiles || [];
            state.realResults = localBackup.realResults || {};
            // Si el admin entra por primera vez y Firebase está vacío, subir el JSON local
            if (state.userRole === 'admin') {
                db.ref('mundial_data').set({ profiles: state.profiles, realResults: state.realResults });
            }
        } else {
            const defaultNames = ["Ibra", "Ali", "Derdabi", "Chakron", "Afassi"];
            state.profiles = defaultNames.map((name, index) => ({
                id: index,
                name: name,
                predictions: {}
            }));
            state.realResults = {};
        }

        // Evitar duplicar listeners de eventos al recibir actualizaciones en tiempo real
        if (!state.isInitialized) {
            state.isInitialized = true;
            completeInit();
        } else {
            // Re-renderizar todo con los nuevos datos recibidos
            renderProfileTabs();
            renderGroupTabs();
            renderMatches();
            updateLiveCalculations();
        }
    });
}

function completeInit() {
    loadStateFromLocalStorage();

    // Inicializar visualmente botones de fase
    const btnGroups = document.getElementById('btn-phase-groups');
    const btnKnockouts = document.getElementById('btn-phase-knockouts');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');

    if (state.activePhase === 'groups') {
        if (btnGroups) btnGroups.classList.add('active');
        if (btnKnockouts) btnKnockouts.classList.remove('active');
        if (groupSel) groupSel.style.display = 'block';
        if (koSel) koSel.style.display = 'none';
    } else {
        if (btnGroups) btnGroups.classList.remove('active');
        if (btnKnockouts) btnKnockouts.classList.add('active');
        if (groupSel) groupSel.style.display = 'none';
        if (koSel) koSel.style.display = 'block';
    }

    // Inicializar visualmente pestaña de ronda eliminatoria
    const koTabs = document.querySelectorAll('#knockout-tabs-container .group-tab');
    koTabs.forEach(tab => {
        if (tab.getAttribute('data-round') === state.activeKnockoutRound) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Registrar Eventos Básicos
    setupEventListeners();

    // Aplicar restricciones de rol
    applyRoleRestrictions();

    // Renders Iniciales
    renderProfileTabs();
    renderGroupTabs();
    updateActiveProfileUI();

    // Iniciar bucle de sincronización automática de API
    checkAndFetchApiResults();
    setInterval(checkAndFetchApiResults, 60000);
}

// Aplicar restricciones de rol (ocultar botones de edición para usuarios comunes)
function applyRoleRestrictions() {
    const btnEditProfiles = document.getElementById('btn-edit-profiles');
    const btnBackup = document.getElementById('btn-backup');
    const header = document.querySelector('.app-header');
    
    if (state.userRole !== 'admin') {
        if (btnEditProfiles) btnEditProfiles.style.display = 'none';
        if (btnBackup) btnBackup.style.display = 'none';
        if (header) header.classList.remove('admin-header');
        // Si el usuario por algún motivo estaba en la pestaña de 'real', lo devolvemos al perfil 0
        if (state.activeProfileId === 'real') {
            state.activeProfileId = 0;
            saveData();
        }
    } else {
        if (btnEditProfiles) btnEditProfiles.style.display = 'flex';
        if (btnBackup) btnBackup.style.display = 'flex';
        if (header) header.classList.add('admin-header');
    }
}

// Lanzar aplicación
window.addEventListener('DOMContentLoaded', initApp);
