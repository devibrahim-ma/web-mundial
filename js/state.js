export const state = {
    profiles: [],
    realResults: {},
    activeProfileId: 0,
    activeGroupId: 'A',
    activePhase: 'groups',
    activeKnockoutRound: 'R32',
    userRole: 'user',
    isInitialized: false,
    apiToken: "",
    lastApiFetchTime: 0,
    apiSyncStatus: "No configurado",
    apiMatchesList: [],
    calendarVisibleStart: null,
    calendarVisibleEnd: null,
    teamsCache: {}
};


export function saveStateToLocalStorage() {
    localStorage.setItem('wc2026_active_profile', state.activeProfileId);
    localStorage.setItem('wc2026_active_group', state.activeGroupId);
    localStorage.setItem('wc2026_active_phase', state.activePhase);
    localStorage.setItem('wc2026_active_ko_round', state.activeKnockoutRound);
}

export function loadStateFromLocalStorage() {
    const savedActiveProfile = localStorage.getItem('wc2026_active_profile');
    const savedActiveGroup = localStorage.getItem('wc2026_active_group');
    const savedActivePhase = localStorage.getItem('wc2026_active_phase');
    const savedActiveKnockoutRound = localStorage.getItem('wc2026_active_ko_round');

    if (savedActiveProfile !== null) {
        state.activeProfileId = (savedActiveProfile === 'real' || savedActiveProfile === 'calendar')
            ? savedActiveProfile
            : parseInt(savedActiveProfile);
    } else {
        state.activeProfileId = 0;
    }

    if (savedActiveGroup) {
        state.activeGroupId = savedActiveGroup;
    } else {
        state.activeGroupId = 'A';
    }

    if (savedActivePhase) {
        state.activePhase = savedActivePhase;
    } else {
        state.activePhase = 'groups';
    }

    if (savedActiveKnockoutRound) {
        state.activeKnockoutRound = savedActiveKnockoutRound;
    } else {
        state.activeKnockoutRound = 'R32';
    }
}

export function saveData() {
    if (state.userRole === 'admin') {
        const updates = {
            profiles: state.profiles,
            realResults: state.realResults
        };
        window.firebase.database().ref('mundial_data').update(updates).catch(err => {
            console.error("Error al guardar en Firebase: ", err);
        });
    }
    saveStateToLocalStorage();
}
