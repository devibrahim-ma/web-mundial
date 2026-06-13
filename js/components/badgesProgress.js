import { MATCHES } from '../constants.js';
import { state } from '../state.js';

export function updateBadgesProgress() {
    let groupCount = 0;
    let totalKoRounds = 6;
    let matchesInRound = [];

    if (state.activePhase === 'groups') {
        matchesInRound = MATCHES[state.activeGroupId];
        totalKoRounds = 6;
    } else {
        if (state.activeKnockoutRound === 'R32') {
            for (let i = 1; i <= 16; i++) matchesInRound.push({ id: `R32-${i}` });
            totalKoRounds = 16;
        } else if (state.activeKnockoutRound === 'R16') {
            for (let i = 1; i <= 8; i++) matchesInRound.push({ id: `R16-${i}` });
            totalKoRounds = 8;
        } else if (state.activeKnockoutRound === 'QF') {
            for (let i = 1; i <= 4; i++) matchesInRound.push({ id: `QF-${i}` });
            totalKoRounds = 4;
        } else if (state.activeKnockoutRound === 'SF') {
            matchesInRound = [{ id: 'SF-1' }, { id: 'SF-2' }];
            totalKoRounds = 2;
        } else if (state.activeKnockoutRound === 'FINAL') {
            matchesInRound = [{ id: '3RD' }, { id: 'FINAL' }];
            totalKoRounds = 2;
        }
    }

    matchesInRound.forEach(match => {
        if (state.activeProfileId === 'real') {
            const res = state.realResults[match.id];
            if (res && res.score1 !== null && res.score2 !== null) {
                if (parseInt(res.score1) === parseInt(res.score2)) {
                    if (res.penaltyWinner) groupCount++;
                } else {
                    groupCount++;
                }
            }
        } else {
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
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
    if (groupBadge) {
        groupBadge.textContent = `${groupCount}/${totalKoRounds} ${state.activeProfileId === 'real' ? 'Resultados' : 'Pronósticos'}`;
    }

    let totalCount = 0;
    for (const gId in MATCHES) {
        MATCHES[gId].forEach(match => {
            if (state.activeProfileId === 'real') {
                const res = state.realResults[match.id];
                if (res && res.score1 !== null && res.score2 !== null) totalCount++;
            } else {
                const profile = state.profiles.find(p => p.id === state.activeProfileId);
                if (profile && profile.predictions[match.id]) {
                    const pred = profile.predictions[match.id];
                    if (pred.score1 !== null && pred.score2 !== null) totalCount++;
                }
            }
        });
    }

    const koMatchIds = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    koMatchIds.forEach(mId => {
        if (state.activeProfileId === 'real') {
            const res = state.realResults[mId];
            if (res && res.score1 !== null && res.score2 !== null) {
                if (parseInt(res.score1) === parseInt(res.score2)) {
                    if (res.penaltyWinner) totalCount++;
                } else {
                    totalCount++;
                }
            }
        } else {
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
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
    if (totalBadge) {
        totalBadge.textContent = `${totalCount}/104 part.`;
    }
}
