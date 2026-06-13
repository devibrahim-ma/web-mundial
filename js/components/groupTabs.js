import { GROUP_IDS } from '../constants.js';
import { state, saveData } from '../state.js';
import { renderMatches } from './matches.js';
import { updateLiveCalculations } from './liveCalculations.js';

export function renderGroupTabs() {
    const container = document.getElementById('group-tabs-container');
    if (!container) return;
    container.innerHTML = '';

    GROUP_IDS.forEach(groupId => {
        const tab = document.createElement('button');
        tab.className = `group-tab ${state.activeGroupId === groupId ? 'active' : ''}`;
        tab.textContent = `Grupo ${groupId}`;
        tab.addEventListener('click', () => {
            state.activeGroupId = groupId;
            saveData();
            
            document.querySelectorAll('.group-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            renderMatches();
            updateLiveCalculations();
        });
        container.appendChild(tab);
    });
}
