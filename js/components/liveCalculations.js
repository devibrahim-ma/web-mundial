import { state } from '../state.js';
import { renderLeaderboard } from './leaderboard.js';
import { updateGroupStats } from './groupStats.js';
import { renderGroupStandingTable } from './groupStandingTable.js';
import { updateBadgesProgress } from './badgesProgress.js';

export function updateLiveCalculations() {
    renderLeaderboard();
    updateGroupStats();
    
    const gridContent = document.getElementById('grid-content');
    const standingCol = document.querySelector('.group-standing-column');
    
    if (state.activePhase === 'groups' && state.activeProfileId !== 'calendar') {
        if (gridContent) gridContent.classList.remove('full-width');
        if (standingCol) standingCol.style.display = 'block';
        renderGroupStandingTable();
    } else {
        if (gridContent) gridContent.classList.add('full-width');
        if (standingCol) standingCol.style.display = 'none';
    }
    
    updateBadgesProgress();
}
