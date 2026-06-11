// --- DATOS DEL MUNDIAL 2026 ---

// python -m http.server 8000
// ?admin=true 

const TEAMS = {
    "MEX": { name: "México", flag: "mx" },
    "RSA": { name: "Sudáfrica", flag: "za" },
    "KOR": { name: "Corea del Sur", flag: "kr" },
    "CZE": { name: "República Checa", flag: "cz" },
    
    "CAN": { name: "Canadá", flag: "ca" },
    "BIH": { name: "Bosnia-Herzegovina", flag: "ba" },
    "QAT": { name: "Qatar", flag: "qa" },
    "SUI": { name: "Suiza", flag: "ch" },
    
    "BRA": { name: "Brasil", flag: "br" },
    "MAR": { name: "Marruecos", flag: "ma" },
    "SCO": { name: "Escocia", flag: "gb-sct" },
    "HAI": { name: "Haití", flag: "ht" },
    
    "USA": { name: "Estados Unidos", flag: "us" },
    "PAR": { name: "Paraguay", flag: "py" },
    "AUS": { name: "Australia", flag: "au" },
    "TUR": { name: "Turquía", flag: "tr" },
    
    "GER": { name: "Alemania", flag: "de" },
    "CUW": { name: "Curazao", flag: "cw" },
    "CIV": { name: "Costa de Marfil", flag: "ci" },
    "ECU": { name: "Ecuador", flag: "ec" },
    
    "NED": { name: "Países Bajos", flag: "nl" },
    "JPN": { name: "Japón", flag: "jp" },
    "SWE": { name: "Suecia", flag: "se" },
    "TUN": { name: "Túnez", flag: "tn" },
    
    "BEL": { name: "Bélgica", flag: "be" },
    "EGY": { name: "Egipto", flag: "eg" },
    "IRN": { name: "Irán", flag: "ir" },
    "NZL": { name: "Nueva Zelanda", flag: "nz" },
    
    "CPV": { name: "Cabo Verde", flag: "cv" },
    "KSA": { name: "Arabia Saudita", flag: "sa" },
    "ESP": { name: "España", flag: "es" },
    "URU": { name: "Uruguay", flag: "uy" },
    
    "FRA": { name: "Francia", flag: "fr" },
    "IRQ": { name: "Irak", flag: "iq" },
    "NOR": { name: "Noruega", flag: "no" },
    "SEN": { name: "Senegal", flag: "sn" },
    
    "ALG": { name: "Argelia", flag: "dz" },
    "ARG": { name: "Argentina", flag: "ar" },
    "AUT": { name: "Austria", flag: "at" },
    "JOR": { name: "Jordania", flag: "jo" },
    
    "COL": { name: "Colombia", flag: "co" },
    "COD": { name: "RD Congo", flag: "cd" },
    "POR": { name: "Portugal", flag: "pt" },
    "UZB": { name: "Uzbekistán", flag: "uz" },
    
    "ENG": { name: "Inglaterra", flag: "gb-eng" },
    "CRO": { name: "Croacia", flag: "hr" },
    "GHA": { name: "Ghana", flag: "gh" },
    "PAN": { name: "Panamá", flag: "pa" }
};

const GROUPS = {
    A: ["MEX", "RSA", "KOR", "CZE"],
    B: ["CAN", "BIH", "QAT", "SUI"],
    C: ["BRA", "MAR", "SCO", "HAI"],
    D: ["USA", "PAR", "AUS", "TUR"],
    E: ["GER", "CUW", "CIV", "ECU"],
    F: ["NED", "JPN", "SWE", "TUN"],
    G: ["BEL", "EGY", "IRN", "NZL"],
    H: ["CPV", "KSA", "ESP", "URU"],
    I: ["FRA", "IRQ", "NOR", "SEN"],
    J: ["ALG", "ARG", "AUT", "JOR"],
    K: ["COL", "COD", "POR", "UZB"],
    L: ["ENG", "CRO", "GHA", "PAN"]
};

// Generación de los 6 partidos por grupo
const MATCHES = {};
const GROUP_IDS = Object.keys(GROUPS);

GROUP_IDS.forEach(groupId => {
    const teams = GROUPS[groupId];
    MATCHES[groupId] = [
        { id: `${groupId}-1`, home: teams[0], away: teams[1] },
        { id: `${groupId}-2`, home: teams[2], away: teams[3] },
        { id: `${groupId}-3`, home: teams[0], away: teams[2] },
        { id: `${groupId}-4`, home: teams[1], away: teams[3] },
        { id: `${groupId}-5`, home: teams[3], away: teams[0] },
        { id: `${groupId}-6`, home: teams[1], away: teams[2] }
    ];
});

// --- ESTADO DE LA APLICACIÓN ---

let profiles = [];
let realResults = {};
let activeProfileId = 0; // 0 a 4 (amigos), o 'real' (Resultados Reales)
let activeGroupId = 'A';
let activePhase = 'groups'; // 'groups' o 'knockouts'
let activeKnockoutRound = 'R32'; // 'R32', 'R16', 'QF', 'SF', 'FINAL'
let userRole = 'user'; // 'user' o 'admin'

// --- INICIALIZACIÓN ---

async function initApp() {
    // 1. Determinar rol a partir del parámetro de URL (?admin=true o ?role=admin) o de LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin') || urlParams.get('role') === 'admin') {
        userRole = 'admin';
        localStorage.setItem('wc2026_role', 'admin');
    } else if (urlParams.get('admin') === 'false' || urlParams.get('role') === 'user') {
        userRole = 'user';
        localStorage.setItem('wc2026_role', 'user');
    } else {
        userRole = localStorage.getItem('wc2026_role') || 'user';
    }

    // 2. Intentar cargar de LocalStorage o del archivo JSON por defecto
    const savedProfiles = localStorage.getItem('wc2026_profiles');
    const savedRealResults = localStorage.getItem('wc2026_real_results');

    if (savedProfiles) {
        profiles = JSON.parse(savedProfiles);
        if (savedRealResults) {
            realResults = JSON.parse(savedRealResults);
        } else {
            realResults = {};
        }
        completeInit();
    } else {
        // Cargar de base de datos json
        try {
            const response = await fetch('predicciones_mundial2026.json');
            const data = await response.json();
            profiles = data.profiles || [];
            realResults = data.realResults || {};
            saveData();
        } catch (error) {
            console.error("Error al cargar predicciones por defecto:", error);
            // Fallback clásico
            const defaultNames = ["Ibra", "Ali", "Derdabi", "Chakron", "Afassi"];
            profiles = defaultNames.map((name, index) => ({
                id: index,
                name: name,
                predictions: {}
            }));
            realResults = {};
        }
        completeInit();
    }
}

function completeInit() {
    const savedActiveProfile = localStorage.getItem('wc2026_active_profile');
    const savedActiveGroup = localStorage.getItem('wc2026_active_group');
    const savedActivePhase = localStorage.getItem('wc2026_active_phase');
    const savedActiveKnockoutRound = localStorage.getItem('wc2026_active_ko_round');

    if (savedActiveProfile !== null) {
        activeProfileId = savedActiveProfile === 'real' ? 'real' : parseInt(savedActiveProfile);
    } else {
        activeProfileId = 0;
    }

    if (savedActiveGroup) {
        activeGroupId = savedActiveGroup;
    } else {
        activeGroupId = 'A';
    }

    if (savedActivePhase) {
        activePhase = savedActivePhase;
    } else {
        activePhase = 'groups';
    }

    if (savedActiveKnockoutRound) {
        activeKnockoutRound = savedActiveKnockoutRound;
    } else {
        activeKnockoutRound = 'R32';
    }

    // Inicializar visualmente botones de fase
    const btnGroups = document.getElementById('btn-phase-groups');
    const btnKnockouts = document.getElementById('btn-phase-knockouts');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');

    if (activePhase === 'groups') {
        btnGroups.classList.add('active');
        btnKnockouts.classList.remove('active');
        groupSel.style.display = 'block';
        koSel.style.display = 'none';
    } else {
        btnGroups.classList.remove('active');
        btnKnockouts.classList.add('active');
        groupSel.style.display = 'none';
        koSel.style.display = 'block';
    }

    // Inicializar visualmente pestaña de ronda eliminatoria
    const koTabs = document.querySelectorAll('#knockout-tabs-container .group-tab');
    koTabs.forEach(tab => {
        if (tab.getAttribute('data-round') === activeKnockoutRound) {
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
    renderMatches();
    updateLiveCalculations();
}

// Aplicar restricciones de rol (ocultar botones de edición para usuarios comunes)
function applyRoleRestrictions() {
    const btnEditProfiles = document.getElementById('btn-edit-profiles');
    const btnBackup = document.getElementById('btn-backup');
    
    if (userRole !== 'admin') {
        if (btnEditProfiles) btnEditProfiles.style.display = 'none';
        if (btnBackup) btnBackup.style.display = 'none';
        // Si el usuario por algún motivo estaba en la pestaña de 'real', lo devolvemos al perfil 0
        if (activeProfileId === 'real') {
            activeProfileId = 0;
            saveData();
        }
    } else {
        if (btnEditProfiles) btnEditProfiles.style.display = 'flex';
        if (btnBackup) btnBackup.style.display = 'flex';
    }
}

// Guardar datos
function saveData() {
    localStorage.setItem('wc2026_profiles', JSON.stringify(profiles));
    localStorage.setItem('wc2026_real_results', JSON.stringify(realResults));
    localStorage.setItem('wc2026_active_profile', activeProfileId);
    localStorage.setItem('wc2026_active_group', activeGroupId);
    localStorage.setItem('wc2026_active_phase', activePhase);
    localStorage.setItem('wc2026_active_ko_round', activeKnockoutRound);
}

// --- FUNCIONES AUXILIARES PARA LA FASE FINAL ---

function isGroupComplete(groupId, profileId) {
    const matches = MATCHES[groupId];
    let count = 0;
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        let score1 = null, score2 = null;
        if (profileId === 'real') {
            const res = realResults[m.id];
            if (res && res.score1 !== null && res.score2 !== null) count++;
        } else {
            const p = profiles.find(pr => pr.id === parseInt(profileId));
            if (p && p.predictions[m.id]) {
                const pred = p.predictions[m.id];
                if (pred.score1 !== null && pred.score2 !== null) count++;
            }
        }
    }
    return count === 6;
}

function getAllGroupStandings(profileId) {
    const allStandings = {};
    GROUP_IDS.forEach(gId => {
        allStandings[gId] = calculateGroupStandings(gId, profileId);
    });
    return allStandings;
}

function getBestThirdPlacedTeams(allStandings) {
    const thirds = [];
    GROUP_IDS.forEach(gId => {
        const stands = allStandings[gId];
        if (stands && stands.length >= 3) {
            thirds.push({
                teamId: stands[2].teamId,
                pts: stands[2].pts,
                gd: stands[2].gd,
                gf: stands[2].gf,
                groupId: gId
            });
        }
    });
    // Ordenar: 1. Puntos, 2. DG, 3. GF, 4. Orden alfabético del Grupo (como criterio simple secundario)
    thirds.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.groupId.localeCompare(b.groupId);
    });
    return thirds.slice(0, 8);
}

function getMatchedThirds(bestThirds) {
    const winnerGroupsWithThirds = ['E', 'I', 'A', 'L', 'G', 'D', 'B', 'K'];
    let remainingThirds = [...bestThirds];
    const matchedThirds = {};
    
    winnerGroupsWithThirds.forEach(wgId => {
        if (remainingThirds.length === 0) {
            matchedThirds[wgId] = null;
            return;
        }
        let index = remainingThirds.findIndex(t => t.groupId !== wgId);
        if (index === -1) index = 0; // Fallback
        
        matchedThirds[wgId] = remainingThirds[index].teamId;
        remainingThirds.splice(index, 1);
    });
    return matchedThirds;
}

function getRound32Matches(profileId) {
    const allStandings = getAllGroupStandings(profileId);
    
    const getWinner = (gId) => isGroupComplete(gId, profileId) ? allStandings[gId][0].teamId : `1º Grupo ${gId}`;
    const getRunner = (gId) => isGroupComplete(gId, profileId) ? allStandings[gId][1].teamId : `2º Grupo ${gId}`;
    
    const allComplete = GROUP_IDS.every(gId => isGroupComplete(gId, profileId));
    const bestThirds = allComplete ? getBestThirdPlacedTeams(allStandings) : [];
    const matchedThirds = allComplete ? getMatchedThirds(bestThirds) : {};
    
    const getThird = (wgId) => allComplete ? matchedThirds[wgId] : `3º Clasificado`;
    
    return [
        { id: "R32-1", home: getRunner('A'), away: getRunner('B'), label: "R32 Partido 1" },
        { id: "R32-2", home: getWinner('C'), away: getRunner('F'), label: "R32 Partido 2" },
        { id: "R32-3", home: getWinner('E'), away: getThird('E'), label: "R32 Partido 3" },
        { id: "R32-4", home: getWinner('F'), away: getRunner('C'), label: "R32 Partido 4" },
        { id: "R32-5", home: getRunner('E'), away: getRunner('I'), label: "R32 Partido 5" },
        { id: "R32-6", home: getWinner('I'), away: getThird('I'), label: "R32 Partido 6" },
        { id: "R32-7", home: getWinner('A'), away: getThird('A'), label: "R32 Partido 7" },
        { id: "R32-8", home: getWinner('L'), away: getThird('L'), label: "R32 Partido 8" },
        { id: "R32-9", home: getWinner('G'), away: getThird('G'), label: "R32 Partido 9" },
        { id: "R32-10", home: getWinner('D'), away: getThird('D'), label: "R32 Partido 10" },
        { id: "R32-11", home: getWinner('H'), away: getRunner('J'), label: "R32 Partido 11" },
        { id: "R32-12", home: getRunner('K'), away: getRunner('L'), label: "R32 Partido 12" },
        { id: "R32-13", home: getWinner('B'), away: getThird('B'), label: "R32 Partido 13" },
        { id: "R32-14", home: getRunner('D'), away: getRunner('G'), label: "R32 Partido 14" },
        { id: "R32-15", home: getWinner('J'), away: getRunner('H'), label: "R32 Partido 15" },
        { id: "R32-16", home: getWinner('K'), away: getThird('K'), label: "R32 Partido 16" }
    ];
}

function getTeamInfo(teamRef, profileId) {
    if (!teamRef) return { name: "Por determinar", flag: null, isPlaceholder: true };
    if (TEAMS[teamRef]) {
        return { name: TEAMS[teamRef].name, flag: TEAMS[teamRef].flag, isPlaceholder: false };
    }
    // Si es un texto tipo "1º Grupo A" o "Ganador R32 Partido 1"
    return { name: teamRef, flag: null, isPlaceholder: true };
}

function getKnockoutWinner(matchId, profileId) {
    const matchObj = getMatchById(matchId, profileId);
    if (!matchObj) return null;
    
    const homeTeamId = matchObj.home;
    const awayTeamId = matchObj.away;
    
    let score1 = null;
    let score2 = null;
    let penaltyWinner = null;
    
    if (profileId === 'real') {
        const res = realResults[matchId];
        if (res && res.score1 !== null && res.score2 !== null) {
            score1 = parseInt(res.score1);
            score2 = parseInt(res.score2);
            penaltyWinner = res.penaltyWinner;
        }
    } else {
        const p = profiles.find(pr => pr.id === parseInt(profileId));
        if (p && p.predictions[matchId]) {
            const pred = p.predictions[matchId];
            if (pred.score1 !== null && pred.score2 !== null) {
                score1 = parseInt(pred.score1);
                score2 = parseInt(pred.score2);
                penaltyWinner = pred.penaltyWinner;
            }
        }
    }
    
    if (score1 === null || score2 === null) return null;
    
    // Si los contrincantes aún no están decididos
    if (homeTeamId && (homeTeamId.includes('Grupo') || homeTeamId.includes('Partido') || homeTeamId.includes('Clasificado') || homeTeamId.includes('Perdedor'))) {
        return null;
    }
    if (awayTeamId && (awayTeamId.includes('Grupo') || awayTeamId.includes('Partido') || awayTeamId.includes('Clasificado') || awayTeamId.includes('Perdedor'))) {
        return null;
    }
    
    if (score1 > score2) return homeTeamId;
    if (score1 < score2) return awayTeamId;
    if (score1 === score2) {
        if (penaltyWinner === 1) return homeTeamId;
        if (penaltyWinner === 2) return awayTeamId;
    }
    return null;
}

function getKnockoutLoser(matchId, profileId) {
    const winner = getKnockoutWinner(matchId, profileId);
    if (!winner) return null;
    
    const matchObj = getMatchById(matchId, profileId);
    if (!matchObj) return null;
    
    if (matchObj.home === winner) return matchObj.away;
    if (matchObj.away === winner) return matchObj.home;
    return null;
}

function getMatchById(matchId, profileId) {
    if (matchId.startsWith('R32-')) {
        const r32Matches = getRound32Matches(profileId);
        return r32Matches.find(m => m.id === matchId);
    }
    
    const resolveWinner = (mId) => {
        const w = getKnockoutWinner(mId, profileId);
        return w ? w : `Ganador ${getMatchLabel(mId)}`;
    };
    
    const resolveLoser = (mId) => {
        const l = getKnockoutLoser(mId, profileId);
        return l ? l : `Perdedor ${getMatchLabel(mId)}`;
    };

    if (matchId.startsWith('R16-')) {
        const index = parseInt(matchId.split('-')[1]);
        const m1 = `R32-${(index * 2) - 1}`;
        const m2 = `R32-${index * 2}`;
        return {
            id: matchId,
            home: resolveWinner(m1),
            away: resolveWinner(m2),
            label: `Octavos Partido ${index}`
        };
    }
    
    if (matchId.startsWith('QF-')) {
        const index = parseInt(matchId.split('-')[1]);
        const m1 = `R16-${(index * 2) - 1}`;
        const m2 = `R16-${index * 2}`;
        return {
            id: matchId,
            home: resolveWinner(m1),
            away: resolveWinner(m2),
            label: `Cuartos Partido ${index}`
        };
    }
    
    if (matchId.startsWith('SF-')) {
        const index = parseInt(matchId.split('-')[1]);
        const m1 = `QF-${(index * 2) - 1}`;
        const m2 = `QF-${index * 2}`;
        return {
            id: matchId,
            home: resolveWinner(m1),
            away: resolveWinner(m2),
            label: `Semifinal ${index}`
        };
    }
    
    if (matchId === '3RD') {
        return {
            id: '3RD',
            home: resolveLoser('SF-1'),
            away: resolveLoser('SF-2'),
            label: 'Tercer Puesto'
        };
    }
    
    if (matchId === 'FINAL') {
        return {
            id: 'FINAL',
            home: resolveWinner('SF-1'),
            away: resolveWinner('SF-2'),
            label: 'Final'
        };
    }
    
    return null;
}

function getMatchLabel(matchId) {
    if (matchId.startsWith('R32-')) return `Dieciseisavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('R16-')) return `Octavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('QF-')) return `Cuartos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('SF-')) return `Semifinal ${matchId.split('-')[1]}`;
    if (matchId === '3RD') return 'Tercer Puesto';
    if (matchId === 'FINAL') return 'Final';
    return matchId;
}

function setPenaltyWinner(matchId, winnerIndex) {
    const isAdmin = activeProfileId === 'real';
    if (isAdmin) {
        if (!realResults[matchId]) realResults[matchId] = { score1: 0, score2: 0 };
        realResults[matchId].penaltyWinner = winnerIndex;
    } else {
        const p = profiles.find(pr => pr.id === activeProfileId);
        if (p) {
            if (!p.predictions[matchId]) p.predictions[matchId] = { score1: 0, score2: 0 };
            p.predictions[matchId].penaltyWinner = winnerIndex;
        }
    }
    saveData();
    renderMatches();
    updateLiveCalculations();
}

// --- RENDERS ---

// Renderizar las pestañas de perfiles en la parte superior
function renderProfileTabs() {
    const container = document.getElementById('profiles-tabs-container');
    container.innerHTML = '';

    // Perfiles de amigos
    profiles.forEach(profile => {
        const tab = document.createElement('button');
        tab.className = `profile-tab ${activeProfileId === profile.id ? 'active' : ''}`;
        tab.innerHTML = `
            <span class="profile-name">${escapeHTML(profile.name)}</span>
        `;
        tab.addEventListener('click', () => {
            activeProfileId = profile.id;
            saveData();
            updateActiveProfileUI();
        });
        container.appendChild(tab);
    });

    // Perfil Especial: Resultados Reales
    const adminTab = document.createElement('button');
    adminTab.className = `profile-tab admin-tab ${activeProfileId === 'real' ? 'active' : ''}`;
    adminTab.innerHTML = `
        <span class="profile-name">Resultados Reales</span>
        ${userRole === 'admin' ? '<span class="profile-role">Administrador</span>' : ''}
    `;
    adminTab.addEventListener('click', () => {
        activeProfileId = 'real';
        saveData();
        updateActiveProfileUI();
    });
    container.appendChild(adminTab);
}

// Actualizar UI al cambiar de perfil sin re-renderizar todo
function updateActiveProfileUI() {
    // Actualizar tabs activas
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach((tab, index) => {
        if (index < profiles.length) {
            tab.className = `profile-tab ${activeProfileId === index ? 'active' : ''}`;
        } else {
            tab.className = `profile-tab admin-tab ${activeProfileId === 'real' ? 'active' : ''}`;
        }
    });

    // Cambiar clases en el contenedor principal si estamos en modo admin
    if (activeProfileId === 'real') {
        document.body.classList.add('admin-mode-active');
    } else {
        document.body.classList.remove('admin-mode-active');
    }

    // Re-renderizar partidos e información asociada al perfil
    renderMatches();
    updateLiveCalculations();
}

// Renderizar pestañas de grupos A - L
function renderGroupTabs() {
    const container = document.getElementById('group-tabs-container');
    container.innerHTML = '';

    GROUP_IDS.forEach(groupId => {
        const tab = document.createElement('button');
        tab.className = `group-tab ${activeGroupId === groupId ? 'active' : ''}`;
        tab.textContent = `Grupo ${groupId}`;
        tab.addEventListener('click', () => {
            activeGroupId = groupId;
            saveData();
            
            // Actualizar pestañas activas
            document.querySelectorAll('.group-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            renderMatches();
            updateLiveCalculations();
        });
        container.appendChild(tab);
    });
}

// Renderizar listado de partidos del grupo o ronda eliminatoria actual
function renderMatches() {
    const container = document.getElementById('matches-list-container');
    container.innerHTML = '';

    const groupTitle = document.getElementById('selected-group-title');
    const isAdmin = activeProfileId === 'real';

    let listToRender = [];

    if (activePhase === 'groups') {
        groupTitle.textContent = `Grupo ${activeGroupId} - Partidos`;
        listToRender = MATCHES[activeGroupId];
    } else {
        let roundName = "";
        let matchIds = [];
        if (activeKnockoutRound === 'R32') {
            roundName = "Dieciseisavos de Final (R32)";
            for (let i = 1; i <= 16; i++) matchIds.push(`R32-${i}`);
        } else if (activeKnockoutRound === 'R16') {
            roundName = "Octavos de Final (R16)";
            for (let i = 1; i <= 8; i++) matchIds.push(`R16-${i}`);
        } else if (activeKnockoutRound === 'QF') {
            roundName = "Cuartos de Final";
            for (let i = 1; i <= 4; i++) matchIds.push(`QF-${i}`);
        } else if (activeKnockoutRound === 'SF') {
            roundName = "Semifinales";
            matchIds = ['SF-1', 'SF-2'];
        } else if (activeKnockoutRound === 'FINAL') {
            roundName = "Finales";
            matchIds = ['3RD', 'FINAL'];
        }

        groupTitle.textContent = roundName;
        // Resolver y cargar los partidos dinámicos del árbol
        listToRender = matchIds.map(mId => getMatchById(mId, activeProfileId));
    }

    listToRender.forEach(match => {
        // Obtener valores guardados
        let val1 = "";
        let val2 = "";
        let penaltyWinner = null;

        if (isAdmin) {
            if (realResults[match.id]) {
                val1 = realResults[match.id].score1 !== null ? realResults[match.id].score1 : "";
                val2 = realResults[match.id].score2 !== null ? realResults[match.id].score2 : "";
                penaltyWinner = realResults[match.id].penaltyWinner || null;
            }
        } else {
            const profile = profiles.find(p => p.id === activeProfileId);
            if (profile && profile.predictions[match.id]) {
                val1 = profile.predictions[match.id].score1 !== null ? profile.predictions[match.id].score1 : "";
                val2 = profile.predictions[match.id].score2 !== null ? profile.predictions[match.id].score2 : "";
                penaltyWinner = profile.predictions[match.id].penaltyWinner || null;
            }
        }

        const card = document.createElement('div');
        card.className = `match-card ${ (val1 !== "" && val2 !== "") ? 'has-prediction' : ''}`;
        card.id = `card-${match.id}`;

        // Obtener la información del equipo (real o marcador de posición)
        const homeTeam = getTeamInfo(match.home, activeProfileId);
        const awayTeam = getTeamInfo(match.away, activeProfileId);

        // Si es eliminatoria y empatan, se debe seleccionar el ganador de penaltis
        const isKnockout = activePhase === 'knockouts';
        const isDraw = val1 !== "" && val2 !== "" && parseInt(val1) === parseInt(val2);
        const isHomeSelectable = isKnockout && isDraw && !homeTeam.isPlaceholder && userRole === 'admin';
        const isAwaySelectable = isKnockout && isDraw && !awayTeam.isPlaceholder && userRole === 'admin';

        // Banderas
        const homeFlagImg = homeTeam.flag 
            ? `<img class="flag-icon" src="https://flagcdn.com/w40/${homeTeam.flag}.png" alt="${homeTeam.name}">` 
            : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;
        const awayFlagImg = awayTeam.flag 
            ? `<img class="flag-icon" src="https://flagcdn.com/w40/${awayTeam.flag}.png" alt="${awayTeam.name}">` 
            : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;

        // Clases de ganadores de tanda de penaltis
        let homeTeamClass = "match-team team-home";
        if (isKnockout && penaltyWinner === 1) homeTeamClass += " penalty-winner";
        
        let awayTeamClass = "match-team team-away";
        if (isKnockout && penaltyWinner === 2) awayTeamClass += " penalty-winner";

        // Determinar si hay un resultado real y calcular puntos para mostrar en la tarjeta (si no es admin)
        let feedbackRowHTML = '';
        if (!isAdmin) {
            const real = realResults[match.id];
            const hasReal = real && real.score1 !== null && real.score2 !== null;
            const hasPred = val1 !== "" && val2 !== "";

            if (hasReal) {
                let ptsText = "0 puntos";
                let ptsClass = "fail";

                if (hasPred) {
                    const p1 = parseInt(val1);
                    const p2 = parseInt(val2);
                    const r1 = parseInt(real.score1);
                    const r2 = parseInt(real.score2);

                    let isPerfect = (p1 === r1 && p2 === r2);
                    if (isPerfect && isKnockout && p1 === p2) {
                        // Empate en eliminatoria exige acertar quién pasó por penaltis
                        isPerfect = (penaltyWinner === real.penaltyWinner);
                    }

                    if (isPerfect) {
                        ptsText = "+3 puntos (Exacto)";
                        ptsClass = "perfect";
                    } else {
                        // En eliminatoria, si no es exacto, comprobar si acertó el equipo que clasifica
                        const predWinner = getKnockoutWinner(match.id, activeProfileId);
                        const realWinner = getKnockoutWinner(match.id, 'real');

                        if (isKnockout && predWinner && realWinner && predWinner === realWinner) {
                            ptsText = "+1 punto (Ganador)";
                            ptsClass = "outcome";
                        } else if (!isKnockout) {
                            // En fase de grupos, comprobar ganador/empate normal
                            const predDiff = p1 - p2;
                            const realDiff = r1 - r2;
                            const predOutcome = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
                            const realOutcome = realDiff > 0 ? 1 : (realDiff < 0 ? -1 : 0);

                            if (predOutcome === realOutcome) {
                                ptsText = "+1 punto (Acierto)";
                                ptsClass = "outcome";
                            }
                        }
                    }
                }

                // Generar texto del ganador oficial si fue por penales
                let penaltyText = "";
                if (isKnockout && real.score1 === real.score2) {
                    const realWinnerId = getKnockoutWinner(match.id, 'real');
                    const realWinnerName = realWinnerId ? (TEAMS[realWinnerId] ? TEAMS[realWinnerId].name : realWinnerId) : "";
                    penaltyText = ` (Pasa ${realWinnerName} por Penales)`;
                }

                feedbackRowHTML = `
                    <div class="match-feedback-row">
                        <span class="real-result-indicator">
                            Resultado Real: <strong class="real-result-badge">${real.score1} - ${real.score2}${penaltyText}</strong>
                        </span>
                        <span class="points-awarded ${ptsClass}">${ptsText}</span>
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="match-main-row">
                <!-- Local -->
                <div class="${homeTeamClass}">
                    <span class="team-name ${isHomeSelectable ? 'selectable' : ''} ${homeTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-home-name-${match.id}" 
                        title="${homeTeam.name}">${homeTeam.name}</span>
                    ${homeFlagImg}
                </div>

                <!-- Inputs Marcador -->
                <div class="match-score-inputs">
                    <input type="number" min="0" max="99" class="score-input" 
                        id="input-${match.id}-1" 
                        value="${val1}" 
                        placeholder="-"
                        data-match-id="${match.id}" 
                        data-team-pos="1"
                        ${userRole !== 'admin' ? 'disabled' : ''}>
                    <span class="score-divider">vs</span>
                    <input type="number" min="0" max="99" class="score-input" 
                        id="input-${match.id}-2" 
                        value="${val2}" 
                        placeholder="-"
                        data-match-id="${match.id}" 
                        data-team-pos="2"
                        ${userRole !== 'admin' ? 'disabled' : ''}>
                </div>

                <!-- Visitante -->
                <div class="${awayTeamClass}">
                    ${awayFlagImg}
                    <span class="team-name ${isAwaySelectable ? 'selectable' : ''} ${awayTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-away-name-${match.id}" 
                        title="${awayTeam.name}">${awayTeam.name}</span>
                </div>
            </div>
            ${feedbackRowHTML}
        `;

        // Añadir escuchadores para el cambio de valores interactivo en vivo
        const in1 = card.querySelector(`#input-${match.id}-1`);
        const in2 = card.querySelector(`#input-${match.id}-2`);

        const handleInputChange = () => {
            const v1 = in1.value.trim();
            const v2 = in2.value.trim();

            const score1 = v1 === "" ? null : parseInt(v1);
            const score2 = v2 === "" ? null : parseInt(v2);

            // Actualizar datos
            if (isAdmin) {
                if (score1 === null && score2 === null) {
                    delete realResults[match.id];
                } else {
                    if (!realResults[match.id]) realResults[match.id] = {};
                    realResults[match.id].score1 = score1;
                    realResults[match.id].score2 = score2;
                    
                    // Borrar ganador de penaltis si ya no es empate
                    if (score1 !== null && score2 !== null && score1 !== score2) {
                        delete realResults[match.id].penaltyWinner;
                    }
                }
            } else {
                const profile = profiles.find(p => p.id === activeProfileId);
                if (profile) {
                    if (score1 === null && score2 === null) {
                        delete profile.predictions[match.id];
                    } else {
                        if (!profile.predictions[match.id]) profile.predictions[match.id] = {};
                        profile.predictions[match.id].score1 = score1;
                        profile.predictions[match.id].score2 = score2;
                        
                        // Borrar ganador de penaltis si ya no es empate
                        if (score1 !== null && score2 !== null && score1 !== score2) {
                            delete profile.predictions[match.id].penaltyWinner;
                        }
                    }
                }
            }

            // Cambiar clase visual si está completo
            if (score1 !== null && score2 !== null) {
                card.classList.add('has-prediction');
            } else {
                card.classList.remove('has-prediction');
            }

            saveData();
            updateLiveCalculations();
            
            // Si es eliminatoria y el resultado es empate, refrescar tarjeta para habilitar los clics de penaltis
            if (isKnockout) {
                renderMatches();
            } else if (!isAdmin) {
                updateSingleMatchFeedback(match.id, score1, score2);
            }
        };

        in1.addEventListener('input', handleInputChange);
        in2.addEventListener('input', handleInputChange);

        // Habilitar selección de penaltis al pulsar nombres si está en empate
        if (isHomeSelectable) {
            const nameEl = card.querySelector(`#team-home-name-${match.id}`);
            nameEl.addEventListener('click', () => setPenaltyWinner(match.id, 1));
        }
        if (isAwaySelectable) {
            const nameEl = card.querySelector(`#team-away-name-${match.id}`);
            nameEl.addEventListener('click', () => setPenaltyWinner(match.id, 2));
        }

        container.appendChild(card);
    });
}

// Actualizar el feedback de puntuación de un único partido dinámicamente al escribir
function updateSingleMatchFeedback(matchId, score1, score2) {
    const card = document.getElementById(`card-${matchId}`);
    if (!card) return;

    let feedbackRow = card.querySelector('.match-feedback-row');
    const real = realResults[matchId];
    const hasReal = real && real.score1 !== null && real.score2 !== null;

    if (!hasReal) {
        if (feedbackRow) feedbackRow.remove();
        return;
    }

    let ptsText = "0 puntos";
    let ptsClass = "fail";

    if (score1 !== null && score2 !== null) {
        const p1 = parseInt(score1);
        const p2 = parseInt(score2);
        const r1 = parseInt(real.score1);
        const r2 = parseInt(real.score2);

        if (p1 === r1 && p2 === r2) {
            ptsText = "+3 puntos (Exacto)";
            ptsClass = "perfect";
        } else {
            const predDiff = p1 - p2;
            const realDiff = r1 - r2;
            const predOutcome = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
            const realOutcome = realDiff > 0 ? 1 : (realDiff < 0 ? -1 : 0);

            if (predOutcome === realOutcome) {
                ptsText = "+1 punto (Acierto)";
                ptsClass = "outcome";
            } else {
                ptsText = "0 puntos (Fallo)";
                ptsClass = "fail";
            }
        }
    }

    const html = `
        <span class="real-result-indicator">
            Resultado Real: <strong class="real-result-badge">${real.score1} - ${real.score2}</strong>
        </span>
        <span class="points-awarded ${ptsClass}">${ptsText}</span>
    `;

    if (feedbackRow) {
        feedbackRow.innerHTML = html;
    } else {
        feedbackRow = document.createElement('div');
        feedbackRow.className = 'match-feedback-row';
        feedbackRow.innerHTML = html;
        card.appendChild(feedbackRow);
    }
}

// --- CÁLCULOS E INTERACTIVIDAD EN TIEMPO REAL ---

function updateLiveCalculations() {
    renderLeaderboard();
    
    // Cambiar layout de columnas según la fase activa
    const gridContent = document.getElementById('grid-content');
    const standingCol = document.querySelector('.group-standing-column');
    
    if (activePhase === 'groups') {
        gridContent.classList.remove('full-width');
        standingCol.style.display = 'block';
        renderGroupStandingTable();
    } else {
        gridContent.classList.add('full-width');
        standingCol.style.display = 'none';
    }
    
    updateBadgesProgress();
}

// Rellenar la clasificación de amigos
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    tbody.innerHTML = '';

    const leaderboard = calculateScores();

    leaderboard.forEach((row, index) => {
        const tr = document.createElement('tr');
        if (row.id === activeProfileId) {
            tr.className = 'active-user-row';
        }

        tr.innerHTML = `
            <td class="col-rank">
                <span class="rank-number">${index + 1}</span>
            </td>
            <td class="col-name">
                <span title="${escapeHTML(row.name)}">${escapeHTML(row.name)}</span>
            </td>
            <td class="col-stats text-center">
                ${row.perfect} / ${row.outcome} / ${row.fail}
            </td>
            <td class="col-points text-right">
                ${row.points}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Calcular puntajes de los perfiles
// Calcular puntajes de los perfiles
function calculateScores() {
    const leaderboard = [];

    // Lista de IDs de eliminatorias
    const koMatchIds = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    profiles.forEach(profile => {
        let points = 0;
        let perfectCount = 0;
        let outcomeCount = 0;
        let failCount = 0;

        // 1. Fase de Grupos
        for (const groupId in MATCHES) {
            MATCHES[groupId].forEach(match => {
                const pred = profile.predictions[match.id];
                const real = realResults[match.id];

                const hasPred = pred && pred.score1 !== null && pred.score2 !== null;
                const hasReal = real && real.score1 !== null && real.score2 !== null;

                if (hasPred && hasReal) {
                    const p1 = parseInt(pred.score1);
                    const p2 = parseInt(pred.score2);
                    const r1 = parseInt(real.score1);
                    const r2 = parseInt(real.score2);

                    if (p1 === r1 && p2 === r2) {
                        points += 3;
                        perfectCount++;
                    } else {
                        const predDiff = p1 - p2;
                        const realDiff = r1 - r2;
                        const predOutcome = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
                        const realOutcome = realDiff > 0 ? 1 : (realDiff < 0 ? -1 : 0);

                        if (predOutcome === realOutcome) {
                            points += 1;
                            outcomeCount++;
                        } else {
                            failCount++;
                        }
                    }
                } else {
                    if (hasReal) {
                        failCount++;
                    }
                }
            });
        }

        // 2. Fase Final (Eliminatorias)
        koMatchIds.forEach(mId => {
            const pred = profile.predictions[mId];
            const real = realResults[mId];

            const hasPred = pred && pred.score1 !== null && pred.score2 !== null;
            const hasReal = real && real.score1 !== null && real.score2 !== null;

            if (hasPred && hasReal) {
                const p1 = parseInt(pred.score1);
                const p2 = parseInt(pred.score2);
                const r1 = parseInt(real.score1);
                const r2 = parseInt(real.score2);

                let isExact = p1 === r1 && p2 === r2;
                if (isExact && p1 === p2) {
                    isExact = (pred.penaltyWinner === real.penaltyWinner);
                }

                if (isExact) {
                    points += 3;
                    perfectCount++;
                } else {
                    const predWinner = getKnockoutWinner(mId, profile.id);
                    const realWinner = getKnockoutWinner(mId, 'real');

                    if (predWinner && realWinner && predWinner === realWinner) {
                        points += 1;
                        outcomeCount++;
                    } else {
                        failCount++;
                    }
                }
            } else if (hasReal) {
                failCount++;
            }
        });

        leaderboard.push({
            id: profile.id,
            name: profile.name,
            points: points,
            perfect: perfectCount,
            outcome: outcomeCount,
            fail: failCount
        });
    });

    // Ordenar por puntos desc, luego por aciertos exactos desc y luego por nombre
    leaderboard.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.perfect !== a.perfect) return b.perfect - a.perfect;
        return a.name.localeCompare(b.name);
    });

    return leaderboard;
}

// Calcular y renderizar tabla de posiciones del grupo actual
function renderGroupStandingTable() {
    const tbody = document.getElementById('group-standing-tbody');
    tbody.innerHTML = '';

    const profileNameBadge = document.getElementById('standing-profile-name');
    if (activeProfileId === 'real') {
        profileNameBadge.textContent = "Resultados Reales";
        profileNameBadge.className = "badge badge-gold";
    } else {
        const profile = profiles.find(p => p.id === activeProfileId);
        profileNameBadge.textContent = profile ? profile.name : "Perfil";
        profileNameBadge.className = "badge";
    }

    const standings = calculateGroupStandings(activeGroupId, activeProfileId);

    standings.forEach((row, index) => {
        const team = TEAMS[row.teamId];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td class="text-left">
                <div class="table-team-cell">
                    <img class="flag-icon" src="https://flagcdn.com/w40/${team.flag}.png" alt="${team.name}" onerror="this.src='https://placehold.co/20x15/111/fff?text=${row.teamId}'">
                    <span class="table-team-name" title="${team.name}">${team.name}</span>
                </div>
            </td>
            <td>${row.pld}</td>
            <td>${row.w}</td>
            <td>${row.d}</td>
            <td>${row.l}</td>
            <td>${row.gf}</td>
            <td>${row.ga}</td>
            <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
            <td><strong>${row.pts}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function calculateGroupStandings(groupId, profileId) {
    const teamIds = GROUPS[groupId];
    const standings = {};

    teamIds.forEach(tId => {
        standings[tId] = {
            teamId: tId,
            pld: 0,
            w: 0,
            d: 0,
            l: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            pts: 0
        };
    });

    const matches = MATCHES[groupId];

    matches.forEach(match => {
        let score1 = null;
        let score2 = null;

        if (profileId === 'real') {
            const res = realResults[match.id];
            if (res && res.score1 !== null && res.score2 !== null) {
                score1 = res.score1;
                score2 = res.score2;
            }
        } else {
            const profile = profiles.find(p => p.id === parseInt(profileId));
            if (profile && profile.predictions[match.id]) {
                const pred = profile.predictions[match.id];
                if (pred.score1 !== null && pred.score2 !== null) {
                    score1 = pred.score1;
                    score2 = pred.score2;
                }
            }
        }

        if (score1 !== null && score2 !== null) {
            const home = standings[match.home];
            const away = standings[match.away];

            home.pld++;
            away.pld++;
            home.gf += score1;
            home.ga += score2;
            away.gf += score2;
            away.ga += score1;

            if (score1 > score2) {
                home.w++;
                home.pts += 3;
                away.l++;
            } else if (score1 < score2) {
                away.w++;
                away.pts += 3;
                home.l++;
            } else {
                home.d++;
                home.pts += 1;
                away.d++;
                away.pts += 1;
            }

            home.gd = home.gf - home.ga;
            away.gd = away.gf - away.ga;
        }
    });

    // Convertir a array y ordenar según reglas oficiales
    const standingsArray = Object.values(standings);
    standingsArray.sort((a, b) => {
        // 1. Puntos
        if (b.pts !== a.pts) return b.pts - a.pts;
        // 2. Diferencia de Goles
        if (b.gd !== a.gd) return b.gd - a.gd;
        // 3. Goles Marcados
        if (b.gf !== a.gf) return b.gf - a.gf;
        // 4. Alfabetico
        return a.teamId.localeCompare(b.teamId);
    });

    return standingsArray;
}

// Actualizar badges de progreso
function updateBadgesProgress() {
    let groupCount = 0;
    let totalKoRounds = 6;
    let matchesInRound = [];

    if (activePhase === 'groups') {
        matchesInRound = MATCHES[activeGroupId];
        totalKoRounds = 6;
    } else {
        if (activeKnockoutRound === 'R32') {
            for (let i = 1; i <= 16; i++) matchesInRound.push({ id: `R32-${i}` });
            totalKoRounds = 16;
        } else if (activeKnockoutRound === 'R16') {
            for (let i = 1; i <= 8; i++) matchesInRound.push({ id: `R16-${i}` });
            totalKoRounds = 8;
        } else if (activeKnockoutRound === 'QF') {
            for (let i = 1; i <= 4; i++) matchesInRound.push({ id: `QF-${i}` });
            totalKoRounds = 4;
        } else if (activeKnockoutRound === 'SF') {
            matchesInRound = [{ id: 'SF-1' }, { id: 'SF-2' }];
            totalKoRounds = 2;
        } else if (activeKnockoutRound === 'FINAL') {
            matchesInRound = [{ id: '3RD' }, { id: 'FINAL' }];
            totalKoRounds = 2;
        }
    }

    matchesInRound.forEach(match => {
        if (activeProfileId === 'real') {
            const res = realResults[match.id];
            if (res && res.score1 !== null && res.score2 !== null) {
                if (parseInt(res.score1) === parseInt(res.score2)) {
                    if (res.penaltyWinner) groupCount++;
                } else {
                    groupCount++;
                }
            }
        } else {
            const profile = profiles.find(p => p.id === activeProfileId);
            if (profile && profile.predictions[match.id]) {
                const pred = profile.predictions[match.id];
                if (pred.score1 !== null && pred.score2 !== null) {
                    if (parseInt(pred.score1) === parseInt(pred.score2)) {
                        if (pred.penaltyWinner) groupCount++;
                    } else {
                        groupCount++;
                    }
                }
            }
        }
    });

    const groupBadge = document.getElementById('predictions-progress-badge');
    groupBadge.textContent = `${groupCount}/${totalKoRounds} ${activeProfileId === 'real' ? 'Resultados' : 'Pronósticos'}`;

    // 2. Total partidos pronosticados de todo el torneo (sobre 104)
    let totalCount = 0;
    // Fase de grupos
    for (const gId in MATCHES) {
        MATCHES[gId].forEach(match => {
            if (activeProfileId === 'real') {
                const res = realResults[match.id];
                if (res && res.score1 !== null && res.score2 !== null) totalCount++;
            } else {
                const profile = profiles.find(p => p.id === activeProfileId);
                if (profile && profile.predictions[match.id]) {
                    const pred = profile.predictions[match.id];
                    if (pred.score1 !== null && pred.score2 !== null) totalCount++;
                }
            }
        });
    }
    // Eliminatorias
    const koMatchIds = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    koMatchIds.forEach(mId => {
        if (activeProfileId === 'real') {
            const res = realResults[mId];
            if (res && res.score1 !== null && res.score2 !== null) {
                if (parseInt(res.score1) === parseInt(res.score2)) {
                    if (res.penaltyWinner) totalCount++;
                } else {
                    totalCount++;
                }
            }
        } else {
            const profile = profiles.find(p => p.id === activeProfileId);
            if (profile && profile.predictions[mId]) {
                const pred = profile.predictions[mId];
                if (pred.score1 !== null && pred.score2 !== null) {
                    if (parseInt(pred.score1) === parseInt(pred.score2)) {
                        if (pred.penaltyWinner) totalCount++;
                    } else {
                        totalCount++;
                    }
                }
            }
        }
    });

    const totalBadge = document.getElementById('total-matches-count');
    totalBadge.textContent = `${totalCount}/104 part.`;
}

// --- CONFIGURACIÓN DE EVENTOS (LISTENERS) ---

function setupEventListeners() {
    // Dropdown de Datos/Copia de Seguridad
    const btnBackup = document.getElementById('btn-backup');
    const dropdown = btnBackup.parentElement;

    btnBackup.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('open');
    });

    // Exportar JSON
    document.getElementById('btn-export').addEventListener('click', () => {
        const dataStr = JSON.stringify({ profiles, realResults }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'predicciones_mundial2026.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    // Importar JSON
    document.getElementById('input-import').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Validación básica de estructura
                if (importedData.profiles && Array.isArray(importedData.profiles)) {
                    profiles = importedData.profiles;
                    realResults = importedData.realResults || {};
                    saveData();
                    
                    // Re-inicializar vistas
                    renderProfileTabs();
                    updateActiveProfileUI();
                    alert("¡Datos importados con éxito!");
                } else {
                    alert("El archivo JSON no tiene el formato correcto.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON.");
            }
        };
        reader.readAsText(file);
        // Reset del input file
        e.target.value = "";
    });

    // Reiniciar Todo
    document.getElementById('btn-reset-all').addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres borrar TODOS los pronósticos y nombres? Esta acción no se puede deshacer.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // Modal de Edición de Perfiles
    const btnEditProfiles = document.getElementById('btn-edit-profiles');
    const modal = document.getElementById('modal-edit-profiles');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelProfiles = document.getElementById('btn-cancel-profiles');
    const formEditProfiles = document.getElementById('form-edit-profiles');

    btnEditProfiles.addEventListener('click', () => {
        // Rellenar campos de texto con nombres actuales
        profiles.forEach(p => {
            const input = document.getElementById(`profile-name-${p.id}`);
            if (input) input.value = p.name;
        });
        modal.classList.add('open');
    });

    const closeModal = () => {
        modal.classList.remove('open');
    };

    btnCloseModal.addEventListener('click', closeModal);
    btnCancelProfiles.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    formEditProfiles.addEventListener('submit', (e) => {
        e.preventDefault();
        
        profiles.forEach(p => {
            const input = document.getElementById(`profile-name-${p.id}`);
            if (input && input.value.trim() !== "") {
                p.name = input.value.trim();
            }
        });

        saveData();
        renderProfileTabs();
        updateLiveCalculations();
        closeModal();
    });

    // Cambio de Fase (Grupos / Eliminatorias)
    const btnGroups = document.getElementById('btn-phase-groups');
    const btnKnockouts = document.getElementById('btn-phase-knockouts');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');

    const setPhase = (phase) => {
        activePhase = phase;
        saveData();

        if (phase === 'groups') {
            btnGroups.classList.add('active');
            btnKnockouts.classList.remove('active');
            groupSel.style.display = 'block';
            koSel.style.display = 'none';
        } else {
            btnGroups.classList.remove('active');
            btnKnockouts.classList.add('active');
            groupSel.style.display = 'none';
            koSel.style.display = 'block';
        }

        renderMatches();
        updateLiveCalculations();
    };

    btnGroups.addEventListener('click', () => setPhase('groups'));
    btnKnockouts.addEventListener('click', () => setPhase('knockouts'));

    // Pestañas de Eliminatorias (Dieciseisavos a Final)
    const koTabs = document.querySelectorAll('#knockout-tabs-container .group-tab');
    koTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            koTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeKnockoutRound = tab.getAttribute('data-round');
            saveData();
            renderMatches();
            updateLiveCalculations();
        });
    });
}

// --- AUXILIARES ---

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Lanzar aplicación
window.addEventListener('DOMContentLoaded', initApp);
