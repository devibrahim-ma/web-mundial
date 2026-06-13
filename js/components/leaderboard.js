import { PROFILE_AVATARS, FRIEND_THEMES } from '../constants.js';
import { state } from '../state.js';
import { escapeHTML } from '../helpers.js';
import { calculateScores } from '../calculations.js';

export function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const leaderboard = calculateScores();

    leaderboard.forEach((row, index) => {
        const tr = document.createElement('tr');
        if (row.id === state.activeProfileId) {
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
