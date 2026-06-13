import { TEAMS, MATCHES } from '../constants.js';
import { state, saveData } from '../state.js';
import { getTeamInfo, findLocalMatchByTLA } from '../helpers.js';
import { getMatchById, getKnockoutWinner, setPenaltyWinner } from '../calculations.js';
import { checkAndFetchApiResults } from '../api.js';
import { updateLiveCalculations } from './liveCalculations.js';

function initializeCalendarRange() {
    if (!state.apiMatchesList || state.apiMatchesList.length === 0) {
        state.calendarVisibleStart = null;
        state.calendarVisibleEnd = null;
        return;
    }

    // Ordenar partidos cronológicamente
    state.apiMatchesList.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

    const todayStr = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Buscar índices de partidos de hoy
    let todayIndices = [];
    state.apiMatchesList.forEach((m, idx) => {
        const mDateStr = new Date(m.utcDate).toISOString().split('T')[0];
        if (mDateStr === todayStr) {
            todayIndices.push(idx);
        }
    });

    if (todayIndices.length > 0) {
        state.calendarVisibleStart = todayIndices[0];
        state.calendarVisibleEnd = todayIndices[todayIndices.length - 1];
    } else {
        // Si no hay partidos hoy, buscar el día más cercano con partidos
        const now = Date.now();
        let closestIdx = 0;
        let minDiff = Infinity;

        state.apiMatchesList.forEach((m, idx) => {
            const diff = Math.abs(new Date(m.utcDate) - now);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = idx;
            }
        });

        // Agrupar todos los partidos de esa fecha cercana como pivot
        const closestDateStr = new Date(state.apiMatchesList[closestIdx].utcDate).toISOString().split('T')[0];
        let pivotIndices = [];
        state.apiMatchesList.forEach((m, idx) => {
            const mDateStr = new Date(m.utcDate).toISOString().split('T')[0];
            if (mDateStr === closestDateStr) {
                pivotIndices.push(idx);
            }
        });

        state.calendarVisibleStart = pivotIndices[0];
        state.calendarVisibleEnd = pivotIndices[pivotIndices.length - 1];
    }
}

export function renderMatches() {
    const container = document.getElementById('matches-list-container');
    if (!container) return;
    container.innerHTML = '';

    const groupTitle = document.getElementById('selected-group-title');
    const isAdmin = state.activeProfileId === 'real';

    if (state.activeProfileId === 'calendar') {
        if (groupTitle) groupTitle.textContent = "Calendario de Partidos";
        const progressBadge = document.getElementById('predictions-progress-badge');
        if (progressBadge) {
            let finishedCount = state.apiMatchesList.filter(m => m.status === 'FINISHED').length;
            progressBadge.textContent = `${finishedCount}/${state.apiMatchesList.length} Jugados`;
        }

        if (!state.apiMatchesList || state.apiMatchesList.length === 0) {
            container.innerHTML = `
                <div class="no-matches-info" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
                    <p style="margin-bottom: 15px;">Aún no se han cargado los partidos desde la API.</p>
                    <button class="btn btn-secondary" id="btn-sync-now-calendar">Sincronizar ahora</button>
                </div>
            `;
            const btnSync = container.querySelector('#btn-sync-now-calendar');
            if (btnSync) btnSync.addEventListener('click', () => checkAndFetchApiResults(true));
            return;
        }

        // Ordenar y validar inicialización de rango
        state.apiMatchesList.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
        if (state.calendarVisibleStart === null || state.calendarVisibleEnd === null || 
            state.calendarVisibleStart >= state.apiMatchesList.length || 
            state.calendarVisibleEnd >= state.apiMatchesList.length) {
            initializeCalendarRange();
        }

        // 1. Mostrar botón de anteriores si no estamos en el índice 0
        if (state.calendarVisibleStart > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'calendar-pagination-btn prev-btn';
            prevBtn.id = 'btn-show-prev-matches';
            prevBtn.textContent = 'Mostrar partidos anteriores';
            prevBtn.addEventListener('click', () => {
                state.calendarVisibleStart = Math.max(0, state.calendarVisibleStart - 3);
                renderMatches();
            });
            container.appendChild(prevBtn);
        }

        // 2. Renderizar partidos en el rango
        const visibleMatches = state.apiMatchesList.slice(state.calendarVisibleStart, state.calendarVisibleEnd + 1);

        visibleMatches.forEach(apiMatch => {
            const localMatch = findLocalMatchByTLA(apiMatch.homeTeam.tla, apiMatch.awayTeam.tla);
            const matchId = localMatch ? localMatch.id : `api-${apiMatch.id}`;
            const localHomeCode = localMatch ? localMatch.home : apiMatch.homeTeam.tla;
            const localAwayCode = localMatch ? localMatch.away : apiMatch.awayTeam.tla;

            const matchDate = new Date(apiMatch.utcDate);
            
            // Día de la semana con mayúscula inicial + día y mes
            let weekday = matchDate.toLocaleDateString('es-ES', { weekday: 'long' });
            weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const dateStr = `${weekday}, ${dayMonth}`;
            
            const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            let statusText = "Programado";
            let statusClass = "status-scheduled";
            if (apiMatch.status === 'FINISHED') {
                statusText = "Finalizado";
                statusClass = "status-finished";
            } else if (apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED') {
                statusText = "En Vivo";
                statusClass = "status-live";
            }

            let scoreHome = "";
            let scoreAway = "";
            let penaltyWinner = null;

            if (localMatch && state.realResults[localMatch.id]) {
                scoreHome = state.realResults[localMatch.id].score1 !== null ? state.realResults[localMatch.id].score1 : "";
                scoreAway = state.realResults[localMatch.id].score2 !== null ? state.realResults[localMatch.id].score2 : "";
                penaltyWinner = state.realResults[localMatch.id].penaltyWinner || null;
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

            const homeInfoBtn = homeTeam.sportsDbId
                ? `<button class="team-info-btn" data-team-id="${homeTeam.sportsDbId}" data-team-tla="${localHomeCode}" title="Información de ${homeTeam.name}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                    </svg>
                   </button>`
                : '';
            const awayInfoBtn = awayTeam.sportsDbId
                ? `<button class="team-info-btn" data-team-id="${awayTeam.sportsDbId}" data-team-tla="${localAwayCode}" title="Información de ${awayTeam.name}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                    </svg>
                   </button>`
                : '';

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
                    <div class="${homeTeamClass}">
                        ${homeInfoBtn}
                        <span class="team-name" title="${homeTeam.name}">${homeTeam.name}</span>
                        ${homeFlagImg}
                    </div>

                    <div class="chrono-score-display">
                        <span class="chrono-score-val">${scoreHome !== "" && scoreHome !== null ? scoreHome : "-"}</span>
                        <span class="chrono-score-vs">vs</span>
                        <span class="chrono-score-val">${scoreAway !== "" && scoreAway !== null ? scoreAway : "-"}</span>
                    </div>

                    <div class="${awayTeamClass}">
                        ${awayFlagImg}
                        <span class="team-name" title="${awayTeam.name}">${awayTeam.name}</span>
                        ${awayInfoBtn}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        // 3. Mostrar botón de próximos si no estamos en el final
        if (state.calendarVisibleEnd < state.apiMatchesList.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'calendar-pagination-btn next-btn';
            nextBtn.id = 'btn-show-next-matches';
            nextBtn.textContent = 'Mostrar próximos partidos';
            nextBtn.addEventListener('click', () => {
                state.calendarVisibleEnd = Math.min(state.apiMatchesList.length - 1, state.calendarVisibleEnd + 3);
                renderMatches();
            });
            container.appendChild(nextBtn);
        }

        return;
    }

    let listToRender = [];

    if (state.activePhase === 'groups') {
        if (groupTitle) groupTitle.textContent = `Grupo ${state.activeGroupId} - Partidos`;
        listToRender = MATCHES[state.activeGroupId];
    } else {
        let roundName = "";
        let matchIds = [];
        if (state.activeKnockoutRound === 'R32') {
            roundName = "Dieciseisavos de Final (R32)";
            for (let i = 1; i <= 16; i++) matchIds.push(`R32-${i}`);
        } else if (state.activeKnockoutRound === 'R16') {
            roundName = "Octavos de Final (R16)";
            for (let i = 1; i <= 8; i++) matchIds.push(`R16-${i}`);
        } else if (state.activeKnockoutRound === 'QF') {
            roundName = "Cuartos de Final";
            for (let i = 1; i <= 4; i++) matchIds.push(`QF-${i}`);
        } else if (state.activeKnockoutRound === 'SF') {
            roundName = "Semifinales";
            matchIds = ['SF-1', 'SF-2'];
        } else if (state.activeKnockoutRound === 'FINAL') {
            roundName = "Finales";
            matchIds = ['3RD', 'FINAL'];
        }

        if (groupTitle) groupTitle.textContent = roundName;
        listToRender = matchIds.map(mId => getMatchById(mId, state.activeProfileId));
    }

    listToRender.forEach(match => {
        let val1 = "";
        let val2 = "";
        let penaltyWinner = null;

        if (isAdmin) {
            if (state.realResults[match.id]) {
                val1 = state.realResults[match.id].score1 !== null ? state.realResults[match.id].score1 : "";
                val2 = state.realResults[match.id].score2 !== null ? state.realResults[match.id].score2 : "";
                penaltyWinner = state.realResults[match.id].penaltyWinner || null;
            }
        } else {
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
            if (profile && profile.predictions[match.id]) {
                val1 = profile.predictions[match.id].score1 !== null ? profile.predictions[match.id].score1 : "";
                val2 = profile.predictions[match.id].score2 !== null ? profile.predictions[match.id].score2 : "";
                penaltyWinner = profile.predictions[match.id].penaltyWinner || null;
            }
        }

        const card = document.createElement('div');
        card.className = `match-card ${ (val1 !== "" && val2 !== "") ? 'has-prediction' : ''}`;
        card.id = `card-${match.id}`;

        const homeTeam = getTeamInfo(match.home, state.activeProfileId);
        const awayTeam = getTeamInfo(match.away, state.activeProfileId);

        const isKnockout = state.activePhase === 'knockouts';
        const isDraw = val1 !== "" && val2 !== "" && parseInt(val1) === parseInt(val2);
        const isHomeSelectable = isKnockout && isDraw && !homeTeam.isPlaceholder && state.userRole === 'admin';
        const isAwaySelectable = isKnockout && isDraw && !awayTeam.isPlaceholder && state.userRole === 'admin';

        const homeFlagImg = homeTeam.flag 
            ? `<img class="flag-icon" src="https://flagcdn.com/w40/${homeTeam.flag}.png" alt="${homeTeam.name}">` 
            : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;
        const awayFlagImg = awayTeam.flag 
            ? `<img class="flag-icon" src="https://flagcdn.com/w40/${awayTeam.flag}.png" alt="${awayTeam.name}">` 
            : `<img class="flag-icon" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;

        let homeTeamClass = "match-team team-home";
        if (isKnockout && penaltyWinner === 1) homeTeamClass += " penalty-winner";
        
        let awayTeamClass = "match-team team-away";
        if (isKnockout && penaltyWinner === 2) awayTeamClass += " penalty-winner";

        let feedbackRowHTML = '';
        if (!isAdmin) {
            const real = state.realResults[match.id];
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
                        isPerfect = (penaltyWinner === real.penaltyWinner);
                    }

                    if (isPerfect) {
                        ptsText = "+3 puntos (Exacto)";
                        ptsClass = "perfect";
                    } else {
                        const predWinner = getKnockoutWinner(match.id, state.activeProfileId);
                        const realWinner = getKnockoutWinner(match.id, 'real');

                        if (isKnockout && predWinner && realWinner && predWinner === realWinner) {
                            ptsText = "+1 punto (Ganador)";
                            ptsClass = "outcome";
                        } else if (!isKnockout) {
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

        const homeInfoBtn = '';
        const awayInfoBtn = '';

        card.innerHTML = `
            <div class="match-main-row">
                <div class="${homeTeamClass}">
                    ${homeInfoBtn}
                    <span class="team-name ${isHomeSelectable ? 'selectable' : ''} ${homeTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-home-name-${match.id}" 
                        title="${homeTeam.name}">${homeTeam.name}</span>
                    ${homeFlagImg}
                </div>

                <div class="match-score-inputs">
                    <input type="number" min="0" max="99" class="score-input" 
                        id="input-${match.id}-1" 
                        value="${val1}" 
                        placeholder="-"
                        data-match-id="${match.id}" 
                        data-team-pos="1"
                        ${state.userRole !== 'admin' ? 'disabled' : ''}>
                    <span class="score-divider">vs</span>
                    <input type="number" min="0" max="99" class="score-input" 
                        id="input-${match.id}-2" 
                        value="${val2}" 
                        placeholder="-"
                        data-match-id="${match.id}" 
                        data-team-pos="2"
                        ${state.userRole !== 'admin' ? 'disabled' : ''}>
                </div>

                <div class="${awayTeamClass}">
                    ${awayFlagImg}
                    <span class="team-name ${isAwaySelectable ? 'selectable' : ''} ${awayTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-away-name-${match.id}" 
                        title="${awayTeam.name}">${awayTeam.name}</span>
                    ${awayInfoBtn}
                </div>
            </div>
            ${feedbackRowHTML}
        `;

        const in1 = card.querySelector(`#input-${match.id}-1`);
        const in2 = card.querySelector(`#input-${match.id}-2`);

        const handleInputChange = () => {
            const v1 = in1.value.trim();
            const v2 = in2.value.trim();

            const score1 = v1 === "" ? null : parseInt(v1);
            const score2 = v2 === "" ? null : parseInt(v2);

            if (isAdmin) {
                if (score1 === null && score2 === null) {
                    delete state.realResults[match.id];
                } else {
                    if (!state.realResults[match.id]) state.realResults[match.id] = {};
                    state.realResults[match.id].score1 = score1;
                    state.realResults[match.id].score2 = score2;
                    
                    if (score1 !== null && score2 !== null && score1 !== score2) {
                        delete state.realResults[match.id].penaltyWinner;
                    }
                }
            } else {
                const profile = state.profiles.find(p => p.id === state.activeProfileId);
                if (profile) {
                    if (score1 === null && score2 === null) {
                        delete profile.predictions[match.id];
                    } else {
                        if (!profile.predictions[match.id]) profile.predictions[match.id] = {};
                        profile.predictions[match.id].score1 = score1;
                        profile.predictions[match.id].score2 = score2;
                        
                        if (score1 !== null && score2 !== null && score1 !== score2) {
                            delete profile.predictions[match.id].penaltyWinner;
                        }
                    }
                }
            }

            if (score1 !== null && score2 !== null) {
                card.classList.add('has-prediction');
            } else {
                card.classList.remove('has-prediction');
            }

            saveData();
            updateLiveCalculations();
            
            if (isKnockout) {
                renderMatches();
            } else if (!isAdmin) {
                updateSingleMatchFeedback(match.id, score1, score2);
            }
        };

        in1.addEventListener('input', handleInputChange);
        in2.addEventListener('input', handleInputChange);

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

export function updateSingleMatchFeedback(matchId, score1, score2) {
    const card = document.getElementById(`card-${matchId}`);
    if (!card) return;

    let feedbackRow = card.querySelector('.match-feedback-row');
    const real = state.realResults[matchId];
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
