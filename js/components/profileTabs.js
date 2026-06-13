import { PROFILE_AVATARS, FRIEND_THEMES } from '../constants.js';
import { state, saveData } from '../state.js';
import { escapeHTML } from '../helpers.js';
import { renderMatches } from './matches.js';
import { updateLiveCalculations } from './liveCalculations.js';

export function renderProfileTabs() {
    const container = document.getElementById('profiles-tabs-container');
    if (!container) return;
    container.innerHTML = '';

    // Perfiles de amigos
    state.profiles.forEach(profile => {
        const tab = document.createElement('button');
        tab.className = `profile-tab ${state.activeProfileId === profile.id ? 'active' : ''}`;
        
        const avatarUrl = PROFILE_AVATARS[profile.id] || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.name)}`;
        
        const theme = FRIEND_THEMES[profile.id];
        let flagsHTML = '';
        if (theme && theme.flags) {
            flagsHTML = `
                <span class="profile-flags">
                    ${theme.flags.map(f => `<img class="mini-flag" src="https://flagcdn.com/w20/${f}.png" alt="">`).join('')}
                </span>
            `;
        }

        tab.innerHTML = `
            <span class="profile-name">
                ${escapeHTML(profile.name)}
                ${flagsHTML}
            </span>
            <div class="avatar-container">
                <img class="profile-avatar" src="${avatarUrl}" alt="${escapeHTML(profile.name)}">
            </div>
        `;
        tab.addEventListener('click', () => {
            state.activeProfileId = profile.id;
            saveData();
            updateActiveProfileUI();
        });
        container.appendChild(tab);
    });

    // Perfil Especial: Calendario
    const calendarTab = document.createElement('button');
    calendarTab.className = `profile-tab calendar-tab ${state.activeProfileId === 'calendar' ? 'active' : ''}`;
    calendarTab.innerHTML = `
        <span class="profile-name">Calendario</span>
        <div class="calendar-avatar-container">
            <img class="profile-avatar" src="assets/calendario.jpg" alt="Calendario">
        </div>
    `;
    calendarTab.addEventListener('click', () => {
        state.activeProfileId = 'calendar';
        saveData();
        updateActiveProfileUI();
    });
    container.appendChild(calendarTab);

    // Perfil Especial: Resultados Reales
    const adminTab = document.createElement('button');
    adminTab.className = `profile-tab admin-tab ${state.activeProfileId === 'real' ? 'active' : ''}`;
    adminTab.innerHTML = `
        <span class="profile-name">Resultados Reales</span>
        <div class="admin-avatar-container">
            <img class="profile-avatar admin-avatar" src="icono.png" alt="Admin">
        </div>
        ${state.userRole === 'admin' ? '<span class="profile-role">Administrador</span>' : ''}
    `;
    adminTab.addEventListener('click', () => {
        state.activeProfileId = 'real';
        saveData();
        updateActiveProfileUI();
    });
    container.appendChild(adminTab);
}

export function updateActiveProfileUI() {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach((tab, index) => {
        if (index < state.profiles.length) {
            tab.className = `profile-tab ${state.activeProfileId === index ? 'active' : ''}`;
        } else if (index === state.profiles.length) {
            tab.className = `profile-tab calendar-tab ${state.activeProfileId === 'calendar' ? 'active' : ''}`;
        } else {
            tab.className = `profile-tab admin-tab ${state.activeProfileId === 'real' ? 'active' : ''}`;
        }
    });

    const bgElement = document.querySelector('.app-background');
    if (bgElement) {
        if (state.activeProfileId === 'real' || state.activeProfileId === 'calendar') {
            bgElement.style.background = "radial-gradient(circle at 10% 20%, rgba(93, 0, 235, 0.15) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(0, 200, 83, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(24, 42, 122, 0.18) 0%, transparent 60%), #05060b";
        } else if (FRIEND_THEMES[state.activeProfileId]) {
            const theme = FRIEND_THEMES[state.activeProfileId];
            if (theme.bgImage) {
                bgElement.style.background = `linear-gradient(rgba(6, 7, 12, 0.84), rgba(6, 7, 12, 0.84)), url('${theme.bgImage}')`;
                bgElement.style.backgroundSize = "cover";
                bgElement.style.backgroundPosition = "center";
            } else {
                bgElement.style.background = theme.gradient;
            }
        }
    }

    const phaseWrapper = document.querySelector('.phase-selector-wrapper');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');
    const standingCol = document.querySelector('.group-standing-column');
    const gridContent = document.getElementById('grid-content');

    if (state.activeProfileId === 'calendar') {
        document.body.classList.remove('admin-mode-active');
        if (phaseWrapper) phaseWrapper.style.display = 'none';
        if (groupSel) groupSel.style.display = 'none';
        if (koSel) koSel.style.display = 'none';
        if (standingCol) standingCol.style.display = 'none';
        if (gridContent) gridContent.classList.add('full-width');
    } else if (state.activeProfileId === 'real') {
        document.body.classList.add('admin-mode-active');
        if (phaseWrapper) phaseWrapper.style.display = 'block';
        
        if (state.activePhase === 'groups') {
            if (groupSel) groupSel.style.display = 'block';
            if (koSel) koSel.style.display = 'none';
            if (standingCol) standingCol.style.display = 'block';
            if (gridContent) gridContent.classList.remove('full-width');
        } else {
            if (groupSel) groupSel.style.display = 'none';
            if (koSel) koSel.style.display = 'block';
            if (standingCol) standingCol.style.display = 'none';
            if (gridContent) gridContent.classList.add('full-width');
        }
    } else {
        document.body.classList.remove('admin-mode-active');
        if (phaseWrapper) phaseWrapper.style.display = 'block';
        
        if (state.activePhase === 'groups') {
            if (groupSel) groupSel.style.display = 'block';
            if (koSel) koSel.style.display = 'none';
            if (standingCol) standingCol.style.display = 'block';
            if (gridContent) gridContent.classList.remove('full-width');
        } else {
            if (groupSel) groupSel.style.display = 'none';
            if (koSel) koSel.style.display = 'block';
            if (standingCol) standingCol.style.display = 'none';
            if (gridContent) gridContent.classList.add('full-width');
        }
    }

    renderMatches();
    updateLiveCalculations();
}
