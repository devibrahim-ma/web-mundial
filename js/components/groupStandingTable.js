import { TEAMS } from '../constants.js';
import { state } from '../state.js';
import { calculateGroupStandings } from '../calculations.js';

export function renderGroupStandingTable() {
    const tbody = document.getElementById('group-standing-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const profileNameBadge = document.getElementById('standing-profile-name');
    if (profileNameBadge) {
        if (state.activeProfileId === 'real') {
            profileNameBadge.textContent = "Resultados Reales";
            profileNameBadge.className = "badge badge-gold";
        } else {
            const profile = state.profiles.find(p => p.id === state.activeProfileId);
            profileNameBadge.textContent = profile ? profile.name : "Perfil";
            profileNameBadge.className = "badge";
        }
    }

    const standings = calculateGroupStandings(state.activeGroupId, state.activeProfileId);

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
