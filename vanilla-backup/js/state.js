export const state = {
    groupId: null,
    myProfileId: null,
    groupName: "",
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
    if (state.groupId) {
        localStorage.setItem(`wc2026_active_profile_${state.groupId}`, state.activeProfileId);
        localStorage.setItem(`wc2026_active_group_${state.groupId}`, state.activeGroupId);
        localStorage.setItem(`wc2026_active_phase_${state.groupId}`, state.activePhase);
        localStorage.setItem(`wc2026_active_ko_round_${state.groupId}`, state.activeKnockoutRound);
    }
}

export function loadStateFromLocalStorage() {
    if (!state.groupId) return;
    
    const savedActiveProfile = localStorage.getItem(`wc2026_active_profile_${state.groupId}`);
    const savedActiveGroup = localStorage.getItem(`wc2026_active_group_${state.groupId}`);
    const savedActivePhase = localStorage.getItem(`wc2026_active_phase_${state.groupId}`);
    const savedActiveKnockoutRound = localStorage.getItem(`wc2026_active_ko_round_${state.groupId}`);

    if (savedActiveProfile !== null) {
        state.activeProfileId = (savedActiveProfile === 'real' || savedActiveProfile === 'calendar')
            ? savedActiveProfile
            : parseInt(savedActiveProfile);
    } else {
        // Por defecto, ir a su propio perfil reclamado o al perfil 0
        state.activeProfileId = state.myProfileId !== null ? state.myProfileId : 0;
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
    if (!state.groupId) {
        saveStateToLocalStorage();
        return;
    }

    const db = window.firebase.database();

    if (state.activeProfileId === 'real' && state.userRole === 'admin') {
        // Guardar resultados reales en el nodo global
        db.ref('mundial_global/realResults').set(state.realResults).catch(err => {
            console.error("Error al guardar resultados reales en Firebase: ", err);
        });
    } else if (state.myProfileId !== null && state.activeProfileId === state.myProfileId) {
        // Guardar pronósticos del perfil reclamado en su sección del grupo
        db.ref(`groups/${state.groupId}/profiles/${state.myProfileId}/predictions`)
            .set(state.profiles[state.myProfileId].predictions || {})
            .catch(err => {
                console.error("Error al guardar predicciones en Firebase: ", err);
            });
    }

    saveStateToLocalStorage();
}
