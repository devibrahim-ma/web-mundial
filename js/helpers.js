import { TEAMS, MATCHES } from './constants.js';
import { getMatchById } from './calculations.js';

export function escapeHTML(str) {
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

export function getTeamInfo(teamRef, profileId) {
    if (!teamRef) return { name: "Por determinar", flag: null, isPlaceholder: true };
    if (TEAMS[teamRef]) {
        return { name: TEAMS[teamRef].name, flag: TEAMS[teamRef].flag, isPlaceholder: false };
    }
    // Si es un texto tipo "1º Grupo A" o "Ganador R32 Partido 1"
    return { name: teamRef, flag: null, isPlaceholder: true };
}

export function findLocalMatchByTLA(homeTLA, awayTLA) {
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
