import { firebaseConfig } from './js/constants.js';
import { state, loadStateFromLocalStorage, saveData } from './js/state.js';
import { renderProfileTabs, updateActiveProfileUI, renderGroupTabs, renderMatches, updateLiveCalculations } from './js/components/index.js';
import { setupEventListeners, setupLandingEvents } from './js/events.js';
import { checkAndFetchApiResults, updateApiStatusUI } from './js/api.js';

// Inicializar Firebase
window.firebase.initializeApp(firebaseConfig);
const db = window.firebase.database();

// --- INICIALIZACIÓN ---
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

    const landingContainer = document.getElementById('landing-container');
    const appContainer = document.querySelector('.app-container');

    if (landingContainer) landingContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    state.groupId = 'chavules';

    // Cargar perfil reclamado por el usuario
    const savedMyProfile = localStorage.getItem(`wc2026_my_profile_id_${state.groupId}`);
    state.myProfileId = savedMyProfile !== null ? parseInt(savedMyProfile) : null;

    // Escuchar datos globales compartidos
    db.ref('mundial_global').on('value', (snapshot) => {
        const globalData = snapshot.val();
        if (globalData) {
            state.realResults = globalData.realResults || {};
            state.apiToken = globalData.apiToken || "";
            state.lastApiFetchTime = globalData.lastApiFetchTime || 0;
            state.apiSyncStatus = globalData.apiSyncStatus || "Sincronizado";
            state.apiMatchesList = globalData.apiMatchesList || state.apiMatchesList;
            updateApiStatusUI();
            
            if (state.isInitialized) {
                renderMatches();
                updateLiveCalculations();
            }
        }
    });

    // Escuchar datos de este grupo específico
    db.ref(`groups/${state.groupId}`).on('value', (snapshot) => {
        const groupData = snapshot.val();
        if (groupData) {
            state.groupName = groupData.name || "Grupo";
            const rawProfiles = groupData.profiles || [];
            state.profiles = rawProfiles.map(p => ({
                ...p,
                predictions: p.predictions || {}
            }));
            
            const groupNameEl = document.getElementById('header-group-name');
            if (groupNameEl) groupNameEl.textContent = state.groupName;

            if (!state.isInitialized) {
                state.isInitialized = true;
                completeInit();
            } else {
                renderProfileTabs();
                renderGroupTabs();
                renderMatches();
                updateLiveCalculations();
            }
        } else {
            alert("El grupo especificado no existe. Redirigiendo para crear uno nuevo.");
            window.location.search = "";
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
