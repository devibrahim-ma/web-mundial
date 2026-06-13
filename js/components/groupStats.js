import { state } from '../state.js';
import { calculateScores } from '../calculations.js';

export function updateGroupStats() {
    const container = document.getElementById('group-stats-container');
    if (!container) return;

    const scores = calculateScores();
    if (scores.length === 0) return;

    let maxPerfect = -1;
    let perfectLeaders = [];
    let maxOutcome = -1;
    let outcomeLeaders = [];
    let totalGoals = 0;

    state.profiles.forEach(p => {
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
