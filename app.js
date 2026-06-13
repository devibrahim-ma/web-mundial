// --- DATOS DEL MUNDIAL 2026 ---

// python -m http.server 8000
// https://web-mundial-lake.vercel.app/?admin=true 
// npx vercel --prod
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

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDQw_ch8DPslkeH07G0V4yf5_IflUyy408",
  authDomain: "web-mundial-2026.firebaseapp.com",
  databaseURL: "https://web-mundial-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "web-mundial-2026",
  storageBucket: "web-mundial-2026.firebasestorage.app",
  messagingSenderId: "931472206945",
  appId: "1:931472206945:web:0816e89360fe4e3a968e20",
  measurementId: "G-29HD6KQ14S"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- ESTADO DE LA APLICACIÓN ---

let profiles = [];
let apiToken = "";
let lastApiFetchTime = 0;
let apiSyncStatus = "No configurado";
let apiMatchesList = [];

// --- FOTOS DE PERFIL DE LOS JUGADORES (Edita las rutas aquí directamente) ---
const PROFILE_AVATARS = {
    0: "assets/ibra.jpeg",  // Perfil 1 (Ibra)
    1: "assets/ali.jpeg",   // Perfil 2 (Ali)
    2: "assets/derdabi.jpeg",                  // Perfil 3 (Derdabi)
    3: "assets/chakron.jpeg",                  // Perfil 4 (Chakron)
    4: "assets/afassi.jpeg"                   // Perfil 5 (Afassi)
};

// --- CONFIGURACIÓN DE SELECCIONES Y FONDOS ---
const FRIEND_THEMES = {
    0: { // Ibra (España y Japón - Temática: España)
        flags: ["es", "jp"],
        bgImage: "assets/theme_es.png",
        gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
    },
    1: { // Ali (España y Portugal - Temática: España)
        flags: ["es", "pt"],
        bgImage: "assets/theme_es.png",
        gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
    },
    2: { // Derdabi (Marruecos y Portugal - Temática: Marruecos)
        flags: ["ma", "pt"],
        bgImage: "assets/theme_ma.png",
        gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(0, 200, 83, 0.12) 0%, transparent 50%), #06070c"
    },
    3: { // Chakron (España y Curazao - Temática: España)
        flags: ["es", "cw"],
        bgImage: "assets/theme_es.png",
        gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
    },
    4: { // Afassi (España y Argentina - Temática: España)
        flags: ["es", "ar"],
        bgImage: "assets/theme_es.png",
        gradient: "radial-gradient(circle at 10% 20%, rgba(213, 0, 0, 0.18) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(255, 234, 0, 0.12) 0%, transparent 50%), #07080f"
    }
};

let realResults = {};
let activeProfileId = 0; // 0 a 4 (amigos), o 'real' (Resultados Reales)
let activeGroupId = 'A';
let activePhase = 'groups'; // 'groups' o 'knockouts'
let activeKnockoutRound = 'R32'; // 'R32', 'R16', 'QF', 'SF', 'FINAL'
let userRole = 'user'; // 'user' o 'admin'
let isInitialized = false;

// --- INICIALIZACIÓN ---

async function initApp() {
    try {
        const cached = localStorage.getItem('wc2026_api_matches');
        if (cached) apiMatchesList = JSON.parse(cached);
    } catch (e) {
        console.error("Error al cargar caché de partidos:", e);
    }

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
            profiles = data.profiles || [];
            realResults = data.realResults || {};
            apiToken = data.apiToken || "";
            lastApiFetchTime = data.lastApiFetchTime || 0;
            apiSyncStatus = data.apiSyncStatus || "Sincronizado";
            updateApiStatusUI();
        } else if (localBackup) {
            profiles = localBackup.profiles || [];
            realResults = localBackup.realResults || {};
            // Si el admin entra por primera vez y Firebase está vacío, subir el JSON local
            if (userRole === 'admin') {
                db.ref('mundial_data').set({ profiles, realResults });
            }
        } else {
            const defaultNames = ["Ibra", "Ali", "Derdabi", "Chakron", "Afassi"];
            profiles = defaultNames.map((name, index) => ({
                id: index,
                name: name,
                predictions: {}
            }));
            realResults = {};
        }

        // Evitar duplicar listeners de eventos al recibir actualizaciones en tiempo real
        if (!isInitialized) {
            isInitialized = true;
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
    const savedActiveProfile = localStorage.getItem('wc2026_active_profile');
    const savedActiveGroup = localStorage.getItem('wc2026_active_group');
    const savedActivePhase = localStorage.getItem('wc2026_active_phase');
    const savedActiveKnockoutRound = localStorage.getItem('wc2026_active_ko_round');

    if (savedActiveProfile !== null) {
        activeProfileId = (savedActiveProfile === 'real' || savedActiveProfile === 'calendar') ? savedActiveProfile : parseInt(savedActiveProfile);
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
    
    if (userRole !== 'admin') {
        if (btnEditProfiles) btnEditProfiles.style.display = 'none';
        if (btnBackup) btnBackup.style.display = 'none';
        if (header) header.classList.remove('admin-header');
        // Si el usuario por algún motivo estaba en la pestaña de 'real', lo devolvemos al perfil 0
        if (activeProfileId === 'real') {
            activeProfileId = 0;
            saveData();
        }
    } else {
        if (btnEditProfiles) btnEditProfiles.style.display = 'flex';
        if (btnBackup) btnBackup.style.display = 'flex';
        if (header) header.classList.add('admin-header');
    }
}

// Guardar datos
function saveData() {
    if (userRole === 'admin') {
        const updates = {
            profiles: profiles,
            realResults: realResults
        };
        db.ref('mundial_data').update(updates).catch(err => {
            console.error("Error al guardar en Firebase: ", err);
        });
    }
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
        if (profileId === 'real' || profileId === 'calendar') {
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
    
    if (profileId === 'real' || profileId === 'calendar') {
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
            activeProfileId = profile.id;
            saveData();
            updateActiveProfileUI();
        });
        container.appendChild(tab);
    });

    // Perfil Especial: Calendario
    const calendarTab = document.createElement('button');
    calendarTab.className = `profile-tab calendar-tab ${activeProfileId === 'calendar' ? 'active' : ''}`;
    calendarTab.innerHTML = `
        <span class="profile-name">Calendario</span>
        <div class="avatar-container">
            <img class="profile-avatar" src="assets/calendario.jpg" alt="Calendario">
        </div>
    `;
    calendarTab.addEventListener('click', () => {
        activeProfileId = 'calendar';
        saveData();
        updateActiveProfileUI();
    });
    container.appendChild(calendarTab);

    // Perfil Especial: Resultados Reales
    const adminTab = document.createElement('button');
    adminTab.className = `profile-tab admin-tab ${activeProfileId === 'real' ? 'active' : ''}`;
    adminTab.innerHTML = `
        <span class="profile-name">Resultados Reales</span>
        <div class="admin-avatar-container">
            <img class="profile-avatar admin-avatar" src="icono.png" alt="Admin">
        </div>
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
        } else if (index === profiles.length) {
            tab.className = `profile-tab calendar-tab ${activeProfileId === 'calendar' ? 'active' : ''}`;
        } else {
            tab.className = `profile-tab admin-tab ${activeProfileId === 'real' ? 'active' : ''}`;
        }
    });

    // Cambiar fondo según la selección del perfil
    const bgElement = document.querySelector('.app-background');
    if (bgElement) {
        if (activeProfileId === 'real' || activeProfileId === 'calendar') {
            // Fondo original de la Copa del Mundo
            bgElement.style.background = "radial-gradient(circle at 10% 20%, rgba(93, 0, 235, 0.15) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(0, 200, 83, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(24, 42, 122, 0.18) 0%, transparent 60%), #05060b";
        } else if (FRIEND_THEMES[activeProfileId]) {
            const theme = FRIEND_THEMES[activeProfileId];
            if (theme.bgImage) {
                // Superponer gradiente oscuro + imagen para legibilidad
                bgElement.style.background = `linear-gradient(rgba(6, 7, 12, 0.84), rgba(6, 7, 12, 0.84)), url('${theme.bgImage}')`;
                bgElement.style.backgroundSize = "cover";
                bgElement.style.backgroundPosition = "center";
            } else {
                bgElement.style.background = theme.gradient;
            }
        }
    }

    // Cambiar clases y visibilidad según si estamos en modo admin ('Resultados Reales') o 'Calendario'
    const phaseWrapper = document.querySelector('.phase-selector-wrapper');
    const groupSel = document.getElementById('group-selector-container');
    const koSel = document.getElementById('knockout-selector-container');
    const standingCol = document.querySelector('.group-standing-column');
    const gridContent = document.getElementById('grid-content');

    if (activeProfileId === 'calendar') {
        document.body.classList.remove('admin-mode-active');
        if (phaseWrapper) phaseWrapper.style.display = 'none';
        if (groupSel) groupSel.style.display = 'none';
        if (koSel) koSel.style.display = 'none';
        if (standingCol) standingCol.style.display = 'none';
        if (gridContent) gridContent.classList.add('full-width');
    } else if (activeProfileId === 'real') {
        document.body.classList.add('admin-mode-active');
        if (phaseWrapper) phaseWrapper.style.display = 'block';
        
        if (activePhase === 'groups') {
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
        
        if (activePhase === 'groups') {
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

    if (activeProfileId === 'calendar') {
        groupTitle.textContent = "Calendario de Partidos";
        const progressBadge = document.getElementById('predictions-progress-badge');
        if (progressBadge) {
            let finishedCount = apiMatchesList.filter(m => m.status === 'FINISHED').length;
            progressBadge.textContent = `${finishedCount}/${apiMatchesList.length} Jugados`;
        }

        if (!apiMatchesList || apiMatchesList.length === 0) {
            container.innerHTML = `
                <div class="no-matches-info" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
                    <p style="margin-bottom: 15px;">Aún no se han cargado los partidos desde la API.</p>
                    <button class="btn btn-secondary" onclick="checkAndFetchApiResults(true)">Sincronizar ahora</button>
                </div>
            `;
            return;
        }

        // Renderizar partidos de la API en orden cronológico
        apiMatchesList.forEach(apiMatch => {
            const localMatch = findLocalMatchByTLA(apiMatch.homeTeam.tla, apiMatch.awayTeam.tla);
            const matchId = localMatch ? localMatch.id : `api-${apiMatch.id}`;
            const localHomeCode = localMatch ? localMatch.home : apiMatch.homeTeam.tla;
            const localAwayCode = localMatch ? localMatch.away : apiMatch.awayTeam.tla;

            // Formatear Fecha y Hora
            const matchDate = new Date(apiMatch.utcDate);
            const dateStr = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            // Estado del partido en español
            let statusText = "Programado";
            let statusClass = "status-scheduled";
            if (apiMatch.status === 'FINISHED') {
                statusText = "Finalizado";
                statusClass = "status-finished";
            } else if (apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED') {
                statusText = "En Vivo";
                statusClass = "status-live";
            }

            // Marcadores (si hay localMatch, permitimos override local)
            let scoreHome = "";
            let scoreAway = "";
            let penaltyWinner = null;

            if (localMatch && realResults[localMatch.id]) {
                scoreHome = realResults[localMatch.id].score1 !== null ? realResults[localMatch.id].score1 : "";
                scoreAway = realResults[localMatch.id].score2 !== null ? realResults[localMatch.id].score2 : "";
                penaltyWinner = realResults[localMatch.id].penaltyWinner || null;
            } else if (apiMatch.score && apiMatch.score.fullTime && apiMatch.score.fullTime.home !== null) {
                scoreHome = apiMatch.score.fullTime.home;
                scoreAway = apiMatch.score.fullTime.away;
            }

            const homeTeam = getTeamInfo(localHomeCode, 'real');
            const awayTeam = getTeamInfo(localAwayCode, 'real');

            const homeFlagImg = homeTeam.flag 
                ? `<img class="flag-icon" src="https://flagcdn.com/w40/${homeTeam.flag}.png" alt="${homeTeam.name}">` 
                : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;
            const awayFlagImg = awayTeam.flag 
                ? `<img class="flag-icon" src="https://flagcdn.com/w40/${awayTeam.flag}.png" alt="${awayTeam.name}">` 
                : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;

            const isKnockout = localMatch && localMatch.phase === 'knockouts';
            let homeTeamClass = "match-team team-home";
            if (isKnockout && penaltyWinner === 1) homeTeamClass += " penalty-winner";
            let awayTeamClass = "match-team team-away";
            if (isKnockout && penaltyWinner === 2) awayTeamClass += " penalty-winner";

            const card = document.createElement('div');
            card.className = `match-card chronological-match-card ${ (scoreHome !== "" && scoreAway !== "") ? 'has-prediction' : ''}`;
            card.id = `card-${matchId}`;

            card.innerHTML = `
                <div class="chronological-date-column">
                    <span class="chrono-date">${dateStr}</span>
                    <span class="chrono-time">${timeStr}</span>
                    <span class="chrono-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="match-main-row flex-grow-1">
                    <!-- Local -->
                    <div class="${homeTeamClass}">
                        <span class="team-name" title="${homeTeam.name}">${homeTeam.name}</span>
                        ${homeFlagImg}
                    </div>

                    <!-- Marcador Centrado y estático -->
                    <div class="chrono-score-display">
                        <span class="chrono-score-val">${scoreHome !== "" && scoreHome !== null ? scoreHome : "-"}</span>
                        <span class="chrono-score-vs">vs</span>
                        <span class="chrono-score-val">${scoreAway !== "" && scoreAway !== null ? scoreAway : "-"}</span>
                    </div>

                    <!-- Visitante -->
                    <div class="${awayTeamClass}">
                        ${awayFlagImg}
                        <span class="team-name" title="${awayTeam.name}">${awayTeam.name}</span>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        return;
    }

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
    updateGroupStats();
    
    // Cambiar layout de columnas según la fase activa
    const gridContent = document.getElementById('grid-content');
    const standingCol = document.querySelector('.group-standing-column');
    
    if (activePhase === 'groups' && activeProfileId !== 'calendar') {
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

        const avatarUrl = PROFILE_AVATARS[row.id] || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.name)}`;

        const theme = FRIEND_THEMES[row.id];
        let flagsHTML = '';
        if (theme && theme.flags) {
            flagsHTML = `
                <span class="profile-flags">
                    ${theme.flags.map(f => `<img class="mini-flag" src="https://flagcdn.com/w20/${f}.png" alt="">`).join('')}
                </span>
            `;
        }

        tr.innerHTML = `
            <td class="col-rank">
                <span class="rank-number">${index + 1}</span>
            </td>
            <td class="col-name">
                <div class="leaderboard-user-cell">
                    <img class="leaderboard-avatar" src="${avatarUrl}" alt="${escapeHTML(row.name)}">
                    <span title="${escapeHTML(row.name)}">${escapeHTML(row.name)} ${flagsHTML}</span>
                </div>
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

        if (profileId === 'real' || profileId === 'calendar') {
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
            const inputName = document.getElementById(`profile-name-${p.id}`);
            if (inputName) inputName.value = p.name;
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
            const inputName = document.getElementById(`profile-name-${p.id}`);
            if (inputName && inputName.value.trim() !== "") {
                p.name = inputName.value.trim();
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

    // Inicializar reproductor de música de fondo
    setupMusicPlayer();
}

// --- REPRODUCTOR DE MÚSICA ---
function setupMusicPlayer() {
    const music = document.getElementById('bg-music');
    const toggleBtn = document.getElementById('btn-music-toggle');
    const volumeSlider = document.getElementById('slider-music-volume');

    if (!music || !toggleBtn || !volumeSlider) return;

    // Configurar volumen inicial
    music.volume = volumeSlider.value;

    // Activar / Mutear
    toggleBtn.addEventListener('click', () => {
        if (music.paused) {
            music.play().then(() => {
                toggleBtn.innerHTML = '<span>🔊</span>';
            }).catch(err => {
                console.log("El navegador bloqueó el inicio rápido: ", err);
            });
        } else {
            music.pause();
            toggleBtn.innerHTML = '<span>🔇</span>';
        }
    });

    // Cambiar volumen
    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        music.volume = val;
        
        // Si el volumen se baja a cero, cambiar icono a muteado
        if (parseFloat(val) === 0) {
            toggleBtn.innerHTML = '<span>🔇</span>';
        } else if (music.paused === false) {
            toggleBtn.innerHTML = '<span>🔊</span>';
        }
    });
}

// --- ACTUALIZAR ESTADÍSTICAS DEL GRUPO (Opción 4) ---
function updateGroupStats() {
    const container = document.getElementById('group-stats-container');
    if (!container) return;

    const scores = calculateScores();
    if (scores.length === 0) return;

    // Buscar máximos
    let maxPerfect = -1;
    let perfectLeaders = [];
    let maxOutcome = -1;
    let outcomeLeaders = [];
    let totalGoals = 0;

    // Calcular goles totales pronosticados
    profiles.forEach(p => {
        if (p.predictions) {
            Object.values(p.predictions).forEach(pred => {
                if (pred && pred.score1 !== null && pred.score1 !== undefined && pred.score1 !== "") {
                    totalGoals += parseInt(pred.score1);
                }
                if (pred && pred.score2 !== null && pred.score2 !== undefined && pred.score2 !== "") {
                    totalGoals += parseInt(pred.score2);
                }
            });
        }
    });

    scores.forEach(row => {
        if (row.perfect > maxPerfect) {
            maxPerfect = row.perfect;
            perfectLeaders = [row.name];
        } else if (row.perfect === maxPerfect && maxPerfect > 0) {
            perfectLeaders.push(row.name);
        }

        if (row.outcome > maxOutcome) {
            maxOutcome = row.outcome;
            outcomeLeaders = [row.name];
        } else if (row.outcome === maxOutcome && maxOutcome > 0) {
            outcomeLeaders.push(row.name);
        }
    });

    const formatLeaders = (arr) => {
        if (arr.length === 0) return 'Ninguno';
        if (arr.length === 1) return arr[0];
        return arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1];
    };

    const perfectLeaderText = maxPerfect > 0 ? `${formatLeaders(perfectLeaders)} (${maxPerfect})` : 'Ninguno';
    const outcomeLeaderText = maxOutcome > 0 ? `${formatLeaders(outcomeLeaders)} (${maxOutcome})` : 'Ninguno';

    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Rey del Pleno (+3 pts):</span>
            <span class="stat-value">${perfectLeaderText}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Más Aciertos (+1 pt):</span>
            <span class="stat-value">${outcomeLeaderText}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Goles Pronosticados:</span>
            <span class="stat-value">${totalGoals} goles</span>
        </div>
    `;
}

// --- AUXILIARES ---

function findLocalMatchByTLA(homeTLA, awayTLA) {
    if (!homeTLA || !awayTLA) return null;

    // 1. Buscar en Fase de Grupos
    for (const groupId in MATCHES) {
        const found = MATCHES[groupId].find(m => 
            (m.home === homeTLA && m.away === awayTLA) ||
            (m.home === awayTLA && m.away === homeTLA)
        );
        if (found) return { ...found, phase: 'groups', groupId };
    }

    // 2. Buscar en Eliminatorias
    const koMatchIds = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    for (const mId of koMatchIds) {
        const m = getMatchById(mId, 'real');
        if (m && m.home && m.away && 
            !m.home.includes('Grupo') && !m.home.includes('Partido') && 
            !m.home.includes('Clasificado') && !m.home.includes('Perdedor')) {
            if ((m.home === homeTLA && m.away === awayTLA) || (m.home === awayTLA && m.away === homeTLA)) {
                return { ...m, phase: 'knockouts' };
            }
        }
    }
    return null;
}

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

// --- SINCRONIZACIÓN DE API ---

function updateApiStatusUI() {
    const statusTextEl = document.getElementById('api-sync-text');
    const syncDot = document.querySelector('.sync-dot');
    if (statusTextEl) {
        statusTextEl.textContent = apiSyncStatus;
    }
    if (syncDot) {
        if (apiSyncStatus.startsWith("Error") || apiSyncStatus.startsWith("Token")) {
            syncDot.className = "sync-dot sync-error";
        } else if (apiSyncStatus.startsWith("Sincronizando")) {
            syncDot.className = "sync-dot sync-loading";
        } else {
            syncDot.className = "sync-dot sync-success";
        }
    }
}

async function checkAndFetchApiResults(force = false) {
    if (!apiToken) {
        apiSyncStatus = "API Token no configurado en Firebase";
        updateApiStatusUI();
        return;
    }

    const now = Date.now();
    // Cooldown de 1 minuto (60,000 ms)
    if (!force && (now - lastApiFetchTime < 1 * 60 * 1000)) {
        const diffSec = Math.ceil((1 * 60 * 1000 - (now - lastApiFetchTime)) / 1000);
        apiSyncStatus = `Sincronizado (Próximo en ~${diffSec}s)`;
        updateApiStatusUI();
        return;
    }

    apiSyncStatus = "Sincronizando con la API...";
    updateApiStatusUI();

    try {
        const response = await fetch(`/api/matches?token=${encodeURIComponent(apiToken)}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.matches) {
            apiMatchesList = data.matches;
            try {
                localStorage.setItem('wc2026_api_matches', JSON.stringify(data.matches));
            } catch (e) {
                console.error("Error al cachear partidos:", e);
            }
            let updatedCount = 0;
            
            // Recopilar todos los partidos de nuestra quiniela
            const allLocalMatches = [];
            
            // 1. Fase de grupos
            for (const groupId in MATCHES) {
                MATCHES[groupId].forEach(m => allLocalMatches.push({ ...m, phase: 'groups' }));
            }
            
            // 2. Eliminatorias
            const koMatchIds = [];
            for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
            for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
            for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
            for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
            koMatchIds.push('3RD');
            koMatchIds.push('FINAL');

            koMatchIds.forEach(mId => {
                const m = getMatchById(mId, 'real');
                if (m) {
                    allLocalMatches.push({ ...m, phase: 'knockouts' });
                }
            });

            // Cruzar datos de la API
            allLocalMatches.forEach(localMatch => {
                if (localMatch.home && localMatch.away && 
                    !localMatch.home.includes('Grupo') && !localMatch.home.includes('Partido') && 
                    !localMatch.home.includes('Clasificado') && !localMatch.home.includes('Perdedor')) {
                    
                    const apiMatch = data.matches.find(m => {
                        const homeTLA = m.homeTeam && m.homeTeam.tla;
                        const awayTLA = m.awayTeam && m.awayTeam.tla;
                        return (homeTLA === localMatch.home && awayTLA === localMatch.away) ||
                               (homeTLA === localMatch.away && awayTLA === localMatch.home);
                    });

                    if (apiMatch && (apiMatch.status === 'FINISHED' || apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED')) {
                        const score = apiMatch.score && apiMatch.score.fullTime;
                        if (score && score.home !== null && score.away !== null) {
                            const isReversed = apiMatch.homeTeam.tla === localMatch.away;
                            const score1 = isReversed ? score.away : score.home;
                            const score2 = isReversed ? score.home : score.away;

                            // Comprobar diferencia
                            const currentReal = realResults[localMatch.id];
                            const isDifferent = !currentReal || currentReal.score1 !== score1 || currentReal.score2 !== score2;

                            if (isDifferent) {
                                if (!realResults[localMatch.id]) realResults[localMatch.id] = {};
                                realResults[localMatch.id].score1 = score1;
                                realResults[localMatch.id].score2 = score2;
                                updatedCount++;
                            }

                            // Si es empate en eliminatoria, comprobar penales
                            if (localMatch.phase === 'knockouts' && score1 === score2) {
                                const pen = apiMatch.score && apiMatch.score.penalties;
                                if (pen && pen.home !== null && pen.away !== null) {
                                    const penHomeWinner = pen.home > pen.away;
                                    let localPenaltyWinner = 0;
                                    if (!isReversed) {
                                        localPenaltyWinner = penHomeWinner ? 1 : 2;
                                    } else {
                                        localPenaltyWinner = penHomeWinner ? 2 : 1;
                                    }

                                    if (!realResults[localMatch.id]) realResults[localMatch.id] = {};
                                    if (realResults[localMatch.id].penaltyWinner !== localPenaltyWinner) {
                                        realResults[localMatch.id].penaltyWinner = localPenaltyWinner;
                                        updatedCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            });

            lastApiFetchTime = Date.now();
            const dateStr = new Date(lastApiFetchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            apiSyncStatus = `Sincronizado a las ${dateStr}`;
            
            // Subir a Firebase los cambios calculados
            db.ref('mundial_data').update({
                realResults: realResults,
                lastApiFetchTime: lastApiFetchTime,
                apiSyncStatus: apiSyncStatus
            });
        }
    } catch (error) {
        console.error("Error en sincronización:", error);
        apiSyncStatus = `Error: ${error.message}`;
        db.ref('mundial_data').update({ apiSyncStatus: apiSyncStatus });
    }
    updateApiStatusUI();
}

// Lanzar aplicación
window.addEventListener('DOMContentLoaded', initApp);
