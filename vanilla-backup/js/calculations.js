import { TEAMS, GROUPS, MATCHES, GROUP_IDS } from './constants.js';
import { state, saveData } from './state.js';
import { renderMatches, updateLiveCalculations } from './components/index.js';

export function isGroupComplete(groupId, profileId) {
    const matches = MATCHES[groupId];
    let count = 0;
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        let score1 = null, score2 = null;
        if (profileId === 'real' || profileId === 'calendar') {
            const res = state.realResults[m.id];
            if (res && res.score1 !== null && res.score2 !== null) count++;
        } else {
            const p = state.profiles.find(pr => pr.id === parseInt(profileId));
            if (p && p.predictions[m.id]) {
                const pred = p.predictions[m.id];
                if (pred.score1 !== null && pred.score2 !== null) count++;
            }
        }
    }
    return count === 6;
}

export function getAllGroupStandings(profileId) {
    const allStandings = {};
    GROUP_IDS.forEach(gId => {
        allStandings[gId] = calculateGroupStandings(gId, profileId);
    });
    return allStandings;
}

export function getBestThirdPlacedTeams(allStandings) {
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
    
    // Ordenar: 1. Puntos, 2. DG, 3. GF, 4. Orden alfabético del Grupo (como criterio secundario)
    thirds.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.groupId.localeCompare(b.groupId);
    });
    return thirds.slice(0, 8);
}

export function getMatchedThirds(bestThirds) {
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

export function getRound32Matches(profileId) {
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

export function getKnockoutWinner(matchId, profileId) {
    const matchObj = getMatchById(matchId, profileId);
    if (!matchObj) return null;
    
    const homeTeamId = matchObj.home;
    const awayTeamId = matchObj.away;
    
    let score1 = null;
    let score2 = null;
    let penaltyWinner = null;
    
    if (profileId === 'real' || profileId === 'calendar') {
        const res = state.realResults[matchId];
        if (res && res.score1 !== null && res.score2 !== null) {
            score1 = parseInt(res.score1);
            score2 = parseInt(res.score2);
            penaltyWinner = res.penaltyWinner;
        }
    } else {
        const p = state.profiles.find(pr => pr.id === parseInt(profileId));
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

export function getKnockoutLoser(matchId, profileId) {
    const winner = getKnockoutWinner(matchId, profileId);
    if (!winner) return null;
    
    const matchObj = getMatchById(matchId, profileId);
    if (!matchObj) return null;
    
    if (matchObj.home === winner) return matchObj.away;
    if (matchObj.away === winner) return matchObj.home;
    return null;
}

export function getMatchById(matchId, profileId) {
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

export function getMatchLabel(matchId) {
    if (matchId.startsWith('R32-')) return `Dieciseisavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('R16-')) return `Octavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('QF-')) return `Cuartos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('SF-')) return `Semifinal ${matchId.split('-')[1]}`;
    if (matchId === '3RD') return 'Tercer Puesto';
    if (matchId === 'FINAL') return 'Final';
    return matchId;
}

export function setPenaltyWinner(matchId, winnerIndex) {
    const isAdmin = state.activeProfileId === 'real';
    if (isAdmin) {
        if (!state.realResults[matchId]) state.realResults[matchId] = { score1: 0, score2: 0 };
        state.realResults[matchId].penaltyWinner = winnerIndex;
    } else {
        const p = state.profiles.find(pr => pr.id === state.activeProfileId);
        if (p) {
            if (!p.predictions[matchId]) p.predictions[matchId] = { score1: 0, score2: 0 };
            p.predictions[matchId].penaltyWinner = winnerIndex;
        }
    }
    saveData();
    renderMatches();
    updateLiveCalculations();
}

export function calculateGroupStandings(groupId, profileId) {
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
            const res = state.realResults[match.id];
            if (res && res.score1 !== null && res.score2 !== null) {
                score1 = res.score1;
                score2 = res.score2;
            }
        } else {
            const profile = state.profiles.find(p => p.id === parseInt(profileId));
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

    const standingsArray = Object.values(standings);
    standingsArray.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.teamId.localeCompare(b.teamId);
    });

    return standingsArray;
}

export function calculateScores() {
    const leaderboard = [];
    const koMatchIds = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    state.profiles.forEach(profile => {
        let points = 0;
        let perfectCount = 0;
        let outcomeCount = 0;
        let failCount = 0;

        // 1. Fase de Grupos
        for (const groupId in MATCHES) {
            MATCHES[groupId].forEach(match => {
                const pred = profile.predictions[match.id];
                const real = state.realResults[match.id];

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
            const real = state.realResults[mId];

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

    leaderboard.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.perfect !== a.perfect) return b.perfect - a.perfect;
        return a.name.localeCompare(b.name);
    });

    return leaderboard;
}
