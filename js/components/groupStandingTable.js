import { TEAMS } from '../constants.js';
import { state } from '../state.js';
import { calculateGroupStandings } from '../calculations.js';

export function renderGroupStandingTable() {
    const tbody = document.getElementById('group-standing-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const profileNameBadge = document.getElementById('standing-profile-name');
    if (profileNameBadge) {
        if (state.activeProfileId === 'real' || state.activeProfileId === 'calendar') {
            profileNameBadge.textContent = "Resultados Reales";
            profileNameBadge.className = "badge badge-gold";
        } else {
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
            profileNameBadge.textContent = profile ? profile.name : "Perfil";
            profileNameBadge.className = "badge";
        }
    }

    const profileIdForStandings = state.activeProfileId === 'calendar' ? 'real' : state.activeProfileId;
    const standings = calculateGroupStandings(state.activeGroupId, profileIdForStandings);

    standings.forEach((row, index) => {
        const team = TEAMS[row.teamId];
        const tr = document.createElement('tr');
        const infoButton = team.sportsDbId 
            ? `<button class="team-info-btn" data-team-id="${team.sportsDbId}" data-team-tla="${row.teamId}" title="Información de ${team.name}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
               </button>` 
            : '';

        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td class="text-left">
                <div class="table-team-cell">
                    <img class="flag-icon" src="https://flagcdn.com/w40/${team.flag}.png" alt="${team.name}" onerror="this.src='https://placehold.co/20x15/111/fff?text=${row.teamId}'">
                    <span class="table-team-name" title="${team.name}">${team.name}</span>
                    ${infoButton}
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
