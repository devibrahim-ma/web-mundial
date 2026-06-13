import { MATCHES } from './constants.js';
import { state } from './state.js';
import { findLocalMatchByTLA } from './helpers.js';
import { getMatchById } from './calculations.js';

export function updateApiStatusUI() {
    const statusTextEl = document.getElementById('api-sync-text');
    const syncDot = document.querySelector('.sync-dot');
    if (statusTextEl) {
        statusTextEl.textContent = state.apiSyncStatus;
    }
    if (syncDot) {
        if (state.apiSyncStatus.startsWith("Error") || state.apiSyncStatus.startsWith("Token") || state.apiSyncStatus.startsWith("API")) {
            syncDot.className = "sync-dot sync-error";
        } else if (state.apiSyncStatus.startsWith("Sincronizando")) {
            syncDot.className = "sync-dot sync-loading";
        } else {
            syncDot.className = "sync-dot sync-success";
        }
    }
}

export async function checkAndFetchApiResults(force = false) {
    if (!state.apiToken) {
        state.apiSyncStatus = "API Token no configurado en Firebase";
        updateApiStatusUI();
        return;
    }

    const now = Date.now();
    // Cooldown de 1 minuto (60,000 ms)
    if (!force && (now - state.lastApiFetchTime < 1 * 60 * 1000)) {
        const diffSec = Math.ceil((1 * 60 * 1000 - (now - state.lastApiFetchTime)) / 1000);
        state.apiSyncStatus = `Sincronizado (Próximo en ~${diffSec}s)`;
        updateApiStatusUI();
        return;
    }

    state.apiSyncStatus = "Sincronizando con la API...";
    updateApiStatusUI();

    try {
        const response = await fetch(`/api/matches?token=${encodeURIComponent(state.apiToken)}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.matches) {
            state.apiMatchesList = data.matches;
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
                            const currentReal = state.realResults[localMatch.id];
                            const isDifferent = !currentReal || currentReal.score1 !== score1 || currentReal.score2 !== score2;

                            if (isDifferent) {
                                if (!state.realResults[localMatch.id]) state.realResults[localMatch.id] = {};
                                state.realResults[localMatch.id].score1 = score1;
                                state.realResults[localMatch.id].score2 = score2;
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

                                    if (!state.realResults[localMatch.id]) state.realResults[localMatch.id] = {};
                                    if (state.realResults[localMatch.id].penaltyWinner !== localPenaltyWinner) {
                                        state.realResults[localMatch.id].penaltyWinner = localPenaltyWinner;
                                        updatedCount++;
                                    }
                                }
                            }
                        }
                    }
                }
            });

            state.lastApiFetchTime = Date.now();
            const dateStr = new Date(state.lastApiFetchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            state.apiSyncStatus = `Sincronizado a las ${dateStr}`;
            
            // Subir a Firebase los cambios calculados
            window.firebase.database().ref('mundial_data').update({
                realResults: state.realResults,
                lastApiFetchTime: state.lastApiFetchTime,
                apiSyncStatus: state.apiSyncStatus
            });
        }
    } catch (error) {
        console.error("Error en sincronización:", error);
        state.apiSyncStatus = `Error: ${error.message}`;
        window.firebase.database().ref('mundial_data').update({ apiSyncStatus: state.apiSyncStatus });
    }
    updateApiStatusUI();
}

export async function fetchTeamInfo(teamId) {
    if (!teamId) return null;
    if (state.teamsCache[teamId]) {
        return state.teamsCache[teamId];
    }

    try {
        const response = await fetch(`/api/team?id=${teamId}`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        state.teamsCache[teamId] = data;
        return data;
    } catch (error) {
        console.error(`Error fetching team info for ID ${teamId}:`, error);
        return null;
    }
}

