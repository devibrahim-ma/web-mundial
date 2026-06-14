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
        renderBracket(container, isAdmin);
        return;
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

        // Buscar el partido correspondiente en la API para comprobar la fecha de inicio
        const apiMatch = (state.apiMatchesList || []).find(m => {
            const h = m.homeTeam && m.homeTeam.tla;
            const a = m.awayTeam && m.awayTeam.tla;
            return (h === match.home && a === match.away) || (h === match.away && a === match.home);
        });
        const matchDate = apiMatch ? new Date(apiMatch.utcDate) : null;
        const isStarted = matchDate && matchDate < new Date();

        console.log(`[DEBUG LOCK] Partido ${match.id} (${match.home} vs ${match.away}):`, {
            encontradoEnAPI: !!apiMatch,
            fechaPartido: matchDate,
            estaEmpezado: isStarted,
            activeProfileId: state.activeProfileId,
            myProfileId: state.myProfileId,
            isEditable: (state.activeProfileId === 'real' && state.userRole === 'admin') || 
                        (state.myProfileId !== null && state.activeProfileId === state.myProfileId && !isStarted)
        });

        const isEditable = (state.userRole === 'admin');

        let matchDateHTML = "";
        if (matchDate) {
            let weekday = matchDate.toLocaleDateString('es-ES', { weekday: 'short' });
            weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            const statusText = isStarted ? "Cerrado" : `${weekday}, ${dayMonth} - ${timeStr}`;
            const statusClass = isStarted ? "locked" : "upcoming";
            matchDateHTML = `<span class="match-date-badge ${statusClass}">${statusText}</span>`;
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
            ${matchDateHTML}
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
                        ${isEditable ? '' : 'disabled'}>
                    <span class="score-divider">vs</span>
                    <input type="number" min="0" max="99" class="score-input" 
                        id="input-${match.id}-2" 
                        value="${val2}" 
                        placeholder="-"
                        data-match-id="${match.id}" 
                        data-team-pos="2"
                        ${isEditable ? '' : 'disabled'}>
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

function renderBracket(container, isAdmin) {
    const groupTitle = document.getElementById('selected-group-title');
    if (groupTitle) groupTitle.textContent = "Fase Final - Cuadro Eliminatorio";

    container.innerHTML = `
        <div class="bracket-view-container" style="position: relative; width: 100%;">
            <button class="bracket-scroll-btn scroll-left" id="btn-bracket-scroll-left" style="display: none;">&lt;</button>
            <button class="bracket-scroll-btn scroll-right" id="btn-bracket-scroll-right" style="display: none;">&gt;</button>
            <div class="bracket-wrapper" id="bracket-scroll-wrapper">
                <div class="bracket-container">
                    <div class="bracket-column r32-column left-side">
                        ${renderBracketMatchHTML('R32-1', isAdmin)}
                        ${renderBracketMatchHTML('R32-2', isAdmin)}
                        ${renderBracketMatchHTML('R32-3', isAdmin)}
                        ${renderBracketMatchHTML('R32-4', isAdmin)}
                        ${renderBracketMatchHTML('R32-5', isAdmin)}
                        ${renderBracketMatchHTML('R32-6', isAdmin)}
                        ${renderBracketMatchHTML('R32-7', isAdmin)}
                        ${renderBracketMatchHTML('R32-8', isAdmin)}
                    </div>
                    <div class="bracket-column r16-column left-side">
                        ${renderBracketMatchHTML('R16-1', isAdmin)}
                        ${renderBracketMatchHTML('R16-2', isAdmin)}
                        ${renderBracketMatchHTML('R16-3', isAdmin)}
                        ${renderBracketMatchHTML('R16-4', isAdmin)}
                    </div>
                    <div class="bracket-column qf-column left-side">
                        ${renderBracketMatchHTML('QF-1', isAdmin)}
                        ${renderBracketMatchHTML('QF-2', isAdmin)}
                    </div>
                    <div class="bracket-column sf-column left-side">
                        ${renderBracketMatchHTML('SF-1', isAdmin)}
                    </div>
                    
                    <div class="bracket-column center-column">
                        <div class="center-round-title">FINAL</div>
                        ${renderBracketMatchHTML('FINAL', isAdmin)}
                        
                        <div class="bracket-cup-wrapper">
                            <img src="assets/copa.png" class="bracket-cup-img" alt="Copa del Mundo">
                        </div>
                        
                        <div class="center-round-title">TERCER PUESTO</div>
                        ${renderBracketMatchHTML('3RD', isAdmin)}
                    </div>
                    
                    <div class="bracket-column sf-column right-side">
                        ${renderBracketMatchHTML('SF-2', isAdmin)}
                    </div>
                    <div class="bracket-column qf-column right-side">
                        ${renderBracketMatchHTML('QF-3', isAdmin)}
                        ${renderBracketMatchHTML('QF-4', isAdmin)}
                    </div>
                    <div class="bracket-column r16-column right-side">
                        ${renderBracketMatchHTML('R16-5', isAdmin)}
                        ${renderBracketMatchHTML('R16-6', isAdmin)}
                        ${renderBracketMatchHTML('R16-7', isAdmin)}
                        ${renderBracketMatchHTML('R16-8', isAdmin)}
                    </div>
                    <div class="bracket-column r32-column right-side">
                        ${renderBracketMatchHTML('R32-9', isAdmin)}
                        ${renderBracketMatchHTML('R32-10', isAdmin)}
                        ${renderBracketMatchHTML('R32-11', isAdmin)}
                        ${renderBracketMatchHTML('R32-12', isAdmin)}
                        ${renderBracketMatchHTML('R32-13', isAdmin)}
                        ${renderBracketMatchHTML('R32-14', isAdmin)}
                        ${renderBracketMatchHTML('R32-15', isAdmin)}
                        ${renderBracketMatchHTML('R32-16', isAdmin)}
                    </div>
                </div>
            </div>
        </div>
    `;

    bindBracketEventListeners(container, isAdmin);
    setupBracketScrollButtons(container);
}

function renderBracketMatchHTML(matchId, isAdmin) {
    const match = getMatchById(matchId, state.activeProfileId);
    if (!match) return '';

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

    const apiMatch = (state.apiMatchesList || []).find(m => {
        const h = m.homeTeam && m.homeTeam.tla;
        const a = m.awayTeam && m.awayTeam.tla;
        return (h === match.home && a === match.away) || (h === match.away && a === match.home);
    });
    const matchDate = apiMatch ? new Date(apiMatch.utcDate) : null;
    const isStarted = matchDate && matchDate < new Date();

    const isEditable = (state.userRole === 'admin');

    const homeTeam = getTeamInfo(match.home, state.activeProfileId);
    const awayTeam = getTeamInfo(match.away, state.activeProfileId);

    const isDraw = val1 !== "" && val2 !== "" && parseInt(val1) === parseInt(val2);
    const isHomeSelectable = isDraw && !homeTeam.isPlaceholder && state.userRole === 'admin';
    const isAwaySelectable = isDraw && !awayTeam.isPlaceholder && state.userRole === 'admin';

    const homeFlagImg = homeTeam.flag 
        ? `<img class="bracket-flag" src="https://flagcdn.com/w20/${homeTeam.flag}.png" alt="${homeTeam.name}">` 
        : `<img class="bracket-flag" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;
    const awayFlagImg = awayTeam.flag 
        ? `<img class="bracket-flag" src="https://flagcdn.com/w20/${awayTeam.flag}.png" alt="${awayTeam.name}">` 
        : `<img class="bracket-flag" src="https://placehold.co/40x30/333/666?text=?" alt="?">`;

    let homeTeamClass = "bracket-match-team team-home";
    if (penaltyWinner === 1) homeTeamClass += " penalty-winner";
    let awayTeamClass = "bracket-match-team team-away";
    if (penaltyWinner === 2) awayTeamClass += " penalty-winner";

    let dateStr = "";
    if (matchDate) {
        const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        dateStr = isStarted ? "Cerrado" : `${dayMonth} - ${timeStr}`;
    } else {
        dateStr = match.label;
    }

    let feedbackHTML = '';
    if (!isAdmin) {
        const real = state.realResults[match.id];
        const hasReal = real && real.score1 !== null && real.score2 !== null;
        const hasPred = val1 !== "" && val2 !== "";

        if (hasReal) {
            let ptsText = "0 pts";
            let ptsClass = "fail";

            if (hasPred) {
                const p1 = parseInt(val1);
                const p2 = parseInt(val2);
                const r1 = parseInt(real.score1);
                const r2 = parseInt(real.score2);

                let isPerfect = (p1 === r1 && p2 === r2);
                if (isPerfect && p1 === p2) {
                    isPerfect = (penaltyWinner === real.penaltyWinner);
                }

                if (isPerfect) {
                    ptsText = "+3 Exacto";
                    ptsClass = "perfect";
                } else {
                    const predWinner = getKnockoutWinner(match.id, state.activeProfileId);
                    const realWinner = getKnockoutWinner(match.id, 'real');

                    if (predWinner && realWinner && predWinner === realWinner) {
                        ptsText = "+1 Ganador";
                        ptsClass = "outcome";
                    }
                }
            }
            feedbackHTML = `
                <div class="bracket-match-feedback">
                    <span class="real-badge">Real: ${real.score1}-${real.score2}</span>
                    <span class="points-badge ${ptsClass}">${ptsText}</span>
                </div>
            `;
        }
    }

    const homeInfoBtn = (!homeTeam.isPlaceholder && homeTeam.sportsDbId)
        ? `<button class="team-info-btn" data-team-id="${homeTeam.sportsDbId}" data-team-tla="${match.home}" title="Informacion de ${homeTeam.name}" style="padding: 2px; margin: 0 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" style="width: 12px; height: 12px;">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
           </button>`
        : '';

    const awayInfoBtn = (!awayTeam.isPlaceholder && awayTeam.sportsDbId)
        ? `<button class="team-info-btn" data-team-id="${awayTeam.sportsDbId}" data-team-tla="${match.away}" title="Informacion de ${awayTeam.name}" style="padding: 2px; margin: 0 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" style="width: 12px; height: 12px;">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
           </button>`
        : '';

    return `
        <div class="bracket-match ${ (val1 !== "" && val2 !== "") ? 'has-prediction' : ''}" id="card-${match.id}">
            <div class="bracket-match-date">${dateStr}</div>
            <div class="${homeTeamClass}">
                <div class="bracket-team-info">
                    ${homeFlagImg}
                    <span class="bracket-team-name ${isHomeSelectable ? 'selectable' : ''} ${homeTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-home-name-${match.id}" 
                        title="${homeTeam.name}">${homeTeam.name}</span>
                    ${homeInfoBtn}
                </div>
                <input type="number" min="0" max="99" class="bracket-score-input" 
                    id="input-${match.id}-1" 
                    value="${val1}" 
                    placeholder="-"
                    data-match-id="${match.id}" 
                    data-team-pos="1"
                    ${isEditable ? '' : 'disabled'}>
            </div>
            <div class="${awayTeamClass}">
                <div class="bracket-team-info">
                    ${awayFlagImg}
                    <span class="bracket-team-name ${isAwaySelectable ? 'selectable' : ''} ${awayTeam.isPlaceholder ? 'placeholder-team' : ''}" 
                        id="team-away-name-${match.id}" 
                        title="${awayTeam.name}">${awayTeam.name}</span>
                    ${awayInfoBtn}
                </div>
                <input type="number" min="0" max="99" class="bracket-score-input" 
                    id="input-${match.id}-2" 
                    value="${val2}" 
                    placeholder="-"
                    data-match-id="${match.id}" 
                    data-team-pos="2"
                    ${isEditable ? '' : 'disabled'}>
            </div>
            ${feedbackHTML}
        </div>
    `;
}

function bindBracketEventListeners(container, isAdmin) {
    const inputs = container.querySelectorAll('.bracket-score-input');
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const matchId = e.target.getAttribute('data-match-id');
            const pos = parseInt(e.target.getAttribute('data-team-pos'));
            const val = e.target.value.trim();
            const score = val === "" ? null : parseInt(val);

            const otherPos = pos === 1 ? 2 : 1;
            const otherInput = container.querySelector(`#input-${matchId}-${otherPos}`);
            const otherVal = otherInput ? otherInput.value.trim() : "";
            const otherScore = otherVal === "" ? null : parseInt(otherVal);

            const score1 = pos === 1 ? score : otherScore;
            const score2 = pos === 2 ? score : otherScore;

            if (isAdmin) {
                if (score1 === null && score2 === null) {
                    delete state.realResults[matchId];
                } else {
                    if (!state.realResults[matchId]) state.realResults[matchId] = {};
                    state.realResults[matchId].score1 = score1;
                    state.realResults[matchId].score2 = score2;
                    if (score1 !== null && score2 !== null && score1 !== score2) {
                        delete state.realResults[matchId].penaltyWinner;
                    }
                }
            } else {
                const profile = state.profiles.find(p => p.id === state.activeProfileId);
                if (profile) {
                    if (score1 === null && score2 === null) {
                        delete profile.predictions[matchId];
                    } else {
                        if (!profile.predictions[matchId]) profile.predictions[matchId] = {};
                        profile.predictions[matchId].score1 = score1;
                        profile.predictions[matchId].score2 = score2;
                        if (score1 !== null && score2 !== null && score1 !== score2) {
                            delete profile.predictions[matchId].penaltyWinner;
                        }
                    }
                }
            }

            const card = container.querySelector(`#card-${matchId}`);
            if (card) {
                if (score1 !== null && score2 !== null) {
                    card.classList.add('has-prediction');
                } else {
                    card.classList.remove('has-prediction');
                }
            }

            saveData();
            updateLiveCalculations();
            renderMatches();
        });
    });

    const selectables = container.querySelectorAll('.bracket-team-name.selectable');
    selectables.forEach(nameEl => {
        nameEl.addEventListener('click', (e) => {
            const idAttr = e.target.getAttribute('id');
            const matchId = idAttr.replace('team-home-name-', '').replace('team-away-name-', '');
            const isHome = idAttr.startsWith('team-home-name-');
            const winnerIndex = isHome ? 1 : 2;
            setPenaltyWinner(matchId, winnerIndex);
        });
    });
}

function setupBracketScrollButtons(container) {
    const wrapper = container.querySelector('#bracket-scroll-wrapper');
    const btnLeft = container.querySelector('#btn-bracket-scroll-left');
    const btnRight = container.querySelector('#btn-bracket-scroll-right');

    if (!wrapper || !btnLeft || !btnRight) return;

    const updateVisibility = () => {
        const scrollLeft = wrapper.scrollLeft;
        const maxScroll = wrapper.scrollWidth - wrapper.clientWidth;

        if (maxScroll <= 0) {
            btnLeft.style.display = 'none';
            btnRight.style.display = 'none';
            return;
        }

        btnLeft.style.display = scrollLeft > 10 ? 'flex' : 'none';
        btnRight.style.display = scrollLeft < maxScroll - 10 ? 'flex' : 'none';
    };

    wrapper.addEventListener('scroll', updateVisibility);

    // Usar ResizeObserver para recalcular la visibilidad en cuanto las dimensiones se establecen
    if (window.ResizeObserver) {
        const observer = new ResizeObserver(() => {
            updateVisibility();
        });
        observer.observe(wrapper);
    } else {
        window.addEventListener('resize', updateVisibility);
    }

    btnLeft.addEventListener('click', () => {
        wrapper.scrollBy({ left: -400, behavior: 'smooth' });
    });

    btnRight.addEventListener('click', () => {
        wrapper.scrollBy({ left: 400, behavior: 'smooth' });
    });

    setTimeout(updateVisibility, 50);
}
