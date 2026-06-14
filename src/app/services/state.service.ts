import { Injectable, signal, computed, effect } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, Database } from 'firebase/database';
import { Profile, MatchResult, Match, LeaderboardItem, Team } from '../models/types';
import { TEAMS, GROUPS, MATCHES, GROUP_IDS, firebaseConfig } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private db!: Database;
  readonly groupId = 'chavules';

  // --- Signals ---
  readonly profiles = signal<Profile[]>([]);
  readonly realResults = signal<Record<string, MatchResult>>({});
  readonly activeProfileId = signal<number | 'real' | 'calendar'>(0);
  readonly activeGroupId = signal<string>('A');
  readonly activePhase = signal<'groups' | 'knockouts'>('groups');
  readonly activeKnockoutRound = signal<string>('R32');
  readonly userRole = signal<'admin' | 'user'>('user');
  readonly myProfileId = signal<number | null>(null);
  readonly groupName = signal<string>('');
  readonly apiSyncStatus = signal<string>('Cargando...');
  readonly apiMatchesList = signal<any[]>([]);
  readonly lastApiFetchTime = signal<number>(0);
  readonly apiToken = signal<string>('');
  readonly isInitialized = signal<boolean>(false);

  // --- Teams Info Modal Signals ---
  readonly isTeamInfoModalOpen = signal<boolean>(false);
  readonly teamInfoLoading = signal<boolean>(false);
  readonly teamInfoError = signal<boolean>(false);
  readonly teamInfoData = signal<any>(null);
  readonly teamInfoActiveTab = signal<'info' | 'squad'>('info');
  readonly kitImageError = signal<boolean>(false);
  private readonly teamsCache: Record<number, any> = {};

  // Pagination for Calendar
  readonly calendarVisibleStart = signal<number | null>(null);
  readonly calendarVisibleEnd = signal<number | null>(null);

  // --- Computed States ---

  // Check if current user owns the active profile
  readonly isMyProfileActive = computed(() => {
    const active = this.activeProfileId();
    const mine = this.myProfileId();
    return active !== 'real' && active !== 'calendar' && mine !== null && active === mine;
  });

  // Check if the current view is editable
  readonly isEditable = computed(() => {
    return this.userRole() === 'admin';
  });

  // Current Active Profile Name
  readonly activeProfileName = computed(() => {
    const activeId = this.activeProfileId();
    if (activeId === 'real') return 'Resultados Reales';
    if (activeId === 'calendar') return 'Calendario';
    const profile = this.profiles().find(p => p.id === activeId);
    return profile ? profile.name : 'Desconocido';
  });

  constructor() {
    this.initFirebase();
    this.loadStateFromLocalStorage();
    
    // Automatically save routing and view state to local storage when signals change
    effect(() => {
      localStorage.setItem(`wc2026_active_profile_${this.groupId}`, String(this.activeProfileId()));
      localStorage.setItem(`wc2026_active_group_${this.groupId}`, this.activeGroupId());
      localStorage.setItem(`wc2026_active_phase_${this.groupId}`, this.activePhase());
      localStorage.setItem(`wc2026_active_ko_round_${this.groupId}`, this.activeKnockoutRound());
    });
  }

  private initFirebase() {
    const app = initializeApp(firebaseConfig);
    this.db = getDatabase(app);

    // Listen to global configurations
    onValue(ref(this.db, 'mundial_global'), (snapshot) => {
      const globalData = snapshot.val();
      if (globalData) {
        this.realResults.set(globalData.realResults || {});
        this.apiToken.set(globalData.apiToken || '');
        this.lastApiFetchTime.set(globalData.lastApiFetchTime || 0);
        this.apiSyncStatus.set(globalData.apiSyncStatus || 'Sincronizado');
        this.apiMatchesList.set(globalData.apiMatchesList || []);
      }
    });

    // Listen to specific group
    onValue(ref(this.db, `groups/${this.groupId}`), (snapshot) => {
      const groupData = snapshot.val();
      if (groupData) {
        this.groupName.set(groupData.name || 'Grupo');
        const rawProfiles = groupData.profiles || [];
        let mappedProfiles = rawProfiles.map((p: any) => ({
          ...p,
          predictions: p.predictions || {}
        }));

        // Auto-cleanup: remove profile named "suli" (case-insensitive)
        const hasSuli = mappedProfiles.some((p: any) => p.name.toLowerCase() === 'suli');
        if (hasSuli) {
          console.log('Detectada Suli en la base de datos de Firebase. Eliminándola...');
          mappedProfiles = mappedProfiles.filter((p: any) => p.name.toLowerCase() !== 'suli');
          // Re-index IDs so they are contiguous (0 to N-1)
          mappedProfiles.forEach((p: any, idx: number) => {
            p.id = idx;
          });
          // Update Firebase database immediately
          set(ref(this.db, `groups/${this.groupId}/profiles`), mappedProfiles).then(() => {
            console.log('Firebase actualizado sin Suli.');
          }).catch(err => {
            console.error('Error al eliminar a Suli de Firebase:', err);
          });
        }

        this.profiles.set(mappedProfiles);
        this.isInitialized.set(true);
      }
    });
  }

  private loadStateFromLocalStorage() {
    // 1. Read Role
    const savedRole = localStorage.getItem('wc2026_role');
    if (savedRole === 'admin') {
      this.userRole.set('admin');
    } else {
      this.userRole.set('user');
    }

    // 2. Read my claimed profile
    const savedMyProfile = localStorage.getItem(`wc2026_my_profile_id_${this.groupId}`);
    if (savedMyProfile !== null) {
      this.myProfileId.set(parseInt(savedMyProfile));
    }

    // 3. Read active profile
    const savedActiveProfile = localStorage.getItem(`wc2026_active_profile_${this.groupId}`);
    if (savedActiveProfile !== null) {
      if (savedActiveProfile === 'real' || savedActiveProfile === 'calendar') {
        this.activeProfileId.set(savedActiveProfile);
      } else {
        this.activeProfileId.set(parseInt(savedActiveProfile));
      }
    } else {
      this.activeProfileId.set(this.myProfileId() !== null ? (this.myProfileId() as number) : 0);
    }

    // 4. Read active group
    const savedActiveGroup = localStorage.getItem(`wc2026_active_group_${this.groupId}`);
    if (savedActiveGroup) {
      this.activeGroupId.set(savedActiveGroup);
    }

    // 5. Read active phase
    const savedActivePhase = localStorage.getItem(`wc2026_active_phase_${this.groupId}`);
    if (savedActivePhase === 'knockouts') {
      this.activePhase.set('knockouts');
    } else {
      this.activePhase.set('groups');
    }

    // 6. Read active knockout round
    const savedActiveKoRound = localStorage.getItem(`wc2026_active_ko_round_${this.groupId}`);
    if (savedActiveKoRound) {
      this.activeKnockoutRound.set(savedActiveKoRound);
    }

    // 7. Read cached calendar
    try {
      const cached = localStorage.getItem('wc2026_api_matches');
      if (cached) {
        this.apiMatchesList.set(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Error al cargar caché de partidos:', e);
    }
  }

  // --- Save Logic ---
  saveData() {
    const activeId = this.activeProfileId();
    if (activeId === 'real' && this.userRole() === 'admin') {
      // Guardar resultados reales globales
      set(ref(this.db, 'mundial_global/realResults'), this.realResults()).catch(err => {
        console.error('Error al guardar resultados reales en Firebase: ', err);
      });
    } else if (this.myProfileId() !== null && activeId === this.myProfileId()) {
      // Guardar pronósticos en la sección correspondiente del perfil del usuario
      const myProfile = this.profiles()[this.myProfileId() as number];
      if (myProfile) {
        set(
          ref(this.db, `groups/${this.groupId}/profiles/${this.myProfileId()}/predictions`),
          myProfile.predictions || {}
        ).catch(err => {
          console.error('Error al guardar predicciones en Firebase: ', err);
        });
      }
    }
  }

  // --- State Mutators ---
  updateMatchScore(matchId: string, score1: number | null, score2: number | null) {
    const isAdmin = this.activeProfileId() === 'real' && this.userRole() === 'admin';
    
    // Check lock (if match is started, users can't edit it, but admin can)
    if (!isAdmin && this.isMatchStarted(matchId)) {
      console.warn(`Intento de edición bloqueado para el partido ${matchId} porque ya ha comenzado.`);
      return;
    }

    if (isAdmin) {
      const current = { ...this.realResults() };
      if (score1 === null && score2 === null) {
        delete current[matchId];
      } else {
        current[matchId] = {
          score1,
          score2,
          penaltyWinner: (score1 !== score2) ? undefined : current[matchId]?.penaltyWinner
        };
      }
      this.realResults.set(current);
    } else {
      const activeId = this.activeProfileId();
      if (typeof activeId === 'number' && this.myProfileId() === activeId) {
        const list = [...this.profiles()];
        const p = list.find(pr => pr.id === activeId);
        if (p) {
          if (score1 === null && score2 === null) {
            delete p.predictions[matchId];
          } else {
            p.predictions[matchId] = {
              score1,
              score2,
              penaltyWinner: (score1 !== score2) ? undefined : p.predictions[matchId]?.penaltyWinner
            };
          }
          this.profiles.set(list);
        }
      }
    }
    this.saveData();
  }

  setPenaltyWinner(matchId: string, winnerIndex: number) {
    const isAdmin = this.activeProfileId() === 'real' && this.userRole() === 'admin';
    if (isAdmin) {
      const current = { ...this.realResults() };
      if (!current[matchId]) current[matchId] = { score1: 0, score2: 0 };
      current[matchId].penaltyWinner = winnerIndex;
      this.realResults.set(current);
    } else {
      const activeId = this.activeProfileId();
      if (typeof activeId === 'number' && this.myProfileId() === activeId) {
        const list = [...this.profiles()];
        const p = list.find(pr => pr.id === activeId);
        if (p) {
          if (!p.predictions[matchId]) p.predictions[matchId] = { score1: 0, score2: 0 };
          p.predictions[matchId].penaltyWinner = winnerIndex;
          this.profiles.set(list);
        }
      }
    }
    this.saveData();
  }

  claimProfile(profileId: number) {
    this.myProfileId.set(profileId);
    localStorage.setItem(`wc2026_my_profile_id_${this.groupId}`, String(profileId));
    // Switch view to claimed profile
    this.activeProfileId.set(profileId);
  }

  updateProfileNames(names: string[]) {
    if (this.userRole() !== 'admin') return;
    
    // Create new structures keeping prediction data, mapped strictly one-to-one to the names array
    const list: Profile[] = [];
    names.forEach((name, idx) => {
      const existing = this.profiles()[idx];
      list.push({
        id: idx,
        name: name.trim(),
        predictions: existing ? existing.predictions : {}
      });
    });

    // Save back to Firebase
    set(ref(this.db, `groups/${this.groupId}/profiles`), list)
      .then(() => {
        this.profiles.set(list);
      })
      .catch(err => {
        console.error('Error saving updated profile names:', err);
      });
  }

  resetAllData() {
    if (this.userRole() !== 'admin') return;
    
    // Clear all predictions from profiles
    const list = this.profiles().map(p => ({
      ...p,
      predictions: {}
    }));

    // Reset real results
    this.realResults.set({});

    // Update Firebase
    set(ref(this.db, `groups/${this.groupId}/profiles`), list);
    set(ref(this.db, 'mundial_global/realResults'), {});
  }

  // --- API Syncing ---
  async syncApiResultsForce() {
    this.apiSyncStatus.set('Sincronizando con la API...');
    try {
      const token = this.apiToken();
      if (!token) {
        this.apiSyncStatus.set('API Token no configurado en Firebase');
        return;
      }
      // Añadimos &_ts=Date.now() para romper cualquier caché del navegador o de la CDN de Vercel
      const response = await fetch(`/api/matches?token=${encodeURIComponent(token)}&_ts=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      console.log('Datos brutos recibidos de la API:', data);
      if (data && data.matches) {
        console.log(`Se han encontrado ${data.matches.length} partidos en la API.`);
        this.apiMatchesList.set(data.matches);
        localStorage.setItem('wc2026_api_matches', JSON.stringify(data.matches));
        
        // Match with local prediction matches and update realResults
        const updatedReal = { ...this.realResults() };
        let updatedCount = 0;

        const allLocalMatches: { id: string; home: string; away: string; phase: 'groups' | 'knockouts' }[] = [];
        
        // 1. Group matches
        for (const gId in MATCHES) {
          MATCHES[gId].forEach(m => allLocalMatches.push({ ...m, phase: 'groups' }));
        }

        // 2. Knockout matches
        const koMatchIds: string[] = [];
        for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
        for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
        for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
        for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
        koMatchIds.push('3RD');
        koMatchIds.push('FINAL');

        koMatchIds.forEach(mId => {
          const m = this.getMatchByIdStatic(mId, 'real', updatedReal);
          if (m) {
            allLocalMatches.push({
              id: m.id,
              home: m.home,
              away: m.away,
              phase: 'knockouts'
            });
          }
        });

        allLocalMatches.forEach(localMatch => {
          if (localMatch.home && localMatch.away && 
              !localMatch.home.includes('Grupo') && !localMatch.home.includes('Partido') && 
              !localMatch.home.includes('Clasificado') && !localMatch.home.includes('Perdedor')) {
            
            const apiMatch = data.matches.find((m: any) => {
              const homeTLA = m.homeTeam?.tla;
              const awayTLA = m.awayTeam?.tla;
              return (homeTLA === localMatch.home && awayTLA === localMatch.away) ||
                     (homeTLA === localMatch.away && awayTLA === localMatch.home);
            });

            if (apiMatch && (apiMatch.status === 'FINISHED' || apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED')) {
              const score = apiMatch.score?.fullTime;
              if (score && score.home !== null && score.away !== null) {
                const isReversed = apiMatch.homeTeam.tla === localMatch.away;
                const score1 = isReversed ? score.away : score.home;
                const score2 = isReversed ? score.home : score.away;

                const currentReal = updatedReal[localMatch.id];
                const isDifferent = !currentReal || currentReal.score1 !== score1 || currentReal.score2 !== score2;

                if (isDifferent) {
                  if (!updatedReal[localMatch.id]) updatedReal[localMatch.id] = { score1: null, score2: null };
                  updatedReal[localMatch.id].score1 = score1;
                  updatedReal[localMatch.id].score2 = score2;
                  updatedCount++;
                }

                if (localMatch.phase === 'knockouts' && score1 === score2) {
                  const pen = apiMatch.score?.penalties;
                  if (pen && pen.home !== null && pen.away !== null) {
                    const penHomeWinner = pen.home > pen.away;
                    const localPenaltyWinner = !isReversed ? (penHomeWinner ? 1 : 2) : (penHomeWinner ? 2 : 1);

                    if (updatedReal[localMatch.id].penaltyWinner !== localPenaltyWinner) {
                      updatedReal[localMatch.id].penaltyWinner = localPenaltyWinner;
                      updatedCount++;
                    }
                  }
                }
              }
            }
          }
        });

        this.lastApiFetchTime.set(Date.now());
        const dateStr = new Date(this.lastApiFetchTime()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const syncMessage = `Sincronizado a las ${dateStr}`;
        this.apiSyncStatus.set(syncMessage);

        update(ref(this.db, 'mundial_global'), {
          realResults: updatedReal,
          lastApiFetchTime: this.lastApiFetchTime(),
          apiSyncStatus: syncMessage,
          apiMatchesList: data.matches
        });
      }
    } catch (e: any) {
      console.error('Error en sincronización:', e);
      const errorMessage = `Error: ${e.message}`;
      this.apiSyncStatus.set(errorMessage);
      update(ref(this.db, 'mundial_global'), { apiSyncStatus: errorMessage });
    }
  }

  // --- Calculations as Signals (Computed) ---

  readonly isGroupComplete = (groupId: string, profileId: number | 'real' | 'calendar') => {
    const matches = MATCHES[groupId];
    let count = 0;
    matches.forEach(m => {
      if (profileId === 'real' || profileId === 'calendar') {
        const res = this.realResults()[m.id];
        if (res && res.score1 !== null && res.score2 !== null) count++;
      } else {
        const p = this.profiles().find(pr => pr.id === profileId);
        if (p && p.predictions[m.id]) {
          const pred = p.predictions[m.id];
          if (pred.score1 !== null && pred.score2 !== null) count++;
        }
      }
    });
    return count === 6;
  };

  // Check if a match has already started according to the API match schedule
  isMatchStarted(matchId: string): boolean {
    const localMatch = this.findLocalMatchById(matchId);
    if (!localMatch) return false;
    
    const apiMatch = this.apiMatchesList().find(m => {
      const h = m.homeTeam?.tla;
      const a = m.awayTeam?.tla;
      return (h === localMatch.home && a === localMatch.away) || (h === localMatch.away && a === localMatch.home);
    });

    if (apiMatch?.utcDate) {
      return new Date(apiMatch.utcDate) < new Date();
    }
    return false;
  }

  private findLocalMatchById(matchId: string): Match | null {
    if (matchId.startsWith('R32-') || matchId.startsWith('R16-') || matchId.startsWith('QF-') || matchId.startsWith('SF-') || matchId === '3RD' || matchId === 'FINAL') {
      return this.getMatchById(matchId);
    }
    for (const gId in MATCHES) {
      const found = MATCHES[gId].find(m => m.id === matchId);
      if (found) return found;
    }
    return null;
  }

  // Standings for all groups based on the active profile ID
  readonly allGroupStandings = computed(() => {
    const activeId = this.activeProfileId();
    const all: Record<string, any[]> = {};
    GROUP_IDS.forEach(gId => {
      all[gId] = this.calculateStandingsForGroup(gId, activeId);
    });
    return all;
  });

  // Check if all group stage matches are complete for the active profile
  readonly allGroupsComplete = computed(() => {
    const activeId = this.activeProfileId();
    return GROUP_IDS.every(gId => this.isGroupComplete(gId, activeId));
  });

  // Best third-placed teams
  readonly bestThirdPlacedTeams = computed(() => {
    const standings = this.allGroupStandings();
    const completed = this.allGroupsComplete();
    if (!completed) return [];

    const thirds: any[] = [];
    GROUP_IDS.forEach(gId => {
      const stands = standings[gId];
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

    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.groupId.localeCompare(b.groupId);
    });

    return thirds.slice(0, 8);
  });

  // Matched thirds mapping
  readonly matchedThirds = computed(() => {
    const bestThirds = this.bestThirdPlacedTeams();
    const winnerGroupsWithThirds = ['E', 'I', 'A', 'L', 'G', 'D', 'B', 'K'];
    const remainingThirds = [...bestThirds];
    const matched: Record<string, string | null> = {};

    winnerGroupsWithThirds.forEach(wgId => {
      if (remainingThirds.length === 0) {
        matched[wgId] = null;
        return;
      }
      let index = remainingThirds.findIndex(t => t.groupId !== wgId);
      if (index === -1) index = 0;

      matched[wgId] = remainingThirds[index].teamId;
      remainingThirds.splice(index, 1);
    });

    return matched;
  });

  // Round of 32 Matches computed
  readonly r32Matches = computed(() => {
    const activeId = this.activeProfileId();
    const standings = this.allGroupStandings();
    const completed = this.allGroupsComplete();
    const matched = this.matchedThirds();

    const getWinner = (gId: string) => this.isGroupComplete(gId, activeId) ? standings[gId][0].teamId : `1º Grupo ${gId}`;
    const getRunner = (gId: string) => this.isGroupComplete(gId, activeId) ? standings[gId][1].teamId : `2º Grupo ${gId}`;
    const getThird = (wgId: string) => completed ? (matched[wgId] || '3º Clasificado') : `3º Clasificado`;

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
  });

 // Central dynamic match resolver
  getMatchById(matchId: string): Match | null {
    const activeId = this.activeProfileId();
    if (matchId.startsWith('R32-')) {
      return this.r32Matches().find(m => m.id === matchId) || null;
    }

    const resolveWinner = (mId: string) => {
      const w = this.getKnockoutWinner(mId, activeId);
      return w ? w : `Ganador ${this.getMatchLabel(mId)}`;
    };

    const resolveLoser = (mId: string) => {
      const l = this.getKnockoutLoser(mId, activeId);
      return l ? l : `Perdedor ${this.getMatchLabel(mId)}`;
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

  private getMatchByIdStatic(matchId: string, profileId: number | 'real' | 'calendar', tempRealResults: Record<string, MatchResult>): Match | null {
    // 1. Si es de la Ronda de 32 (Dieciseisavos), delegamos en el computado normal
    if (matchId.startsWith('R32-')) {
      return this.r32Matches().find(m => m.id === matchId) || null;
    }

    // Helper interno idéntico a tu getMatchById pero usando el objeto temporal tempRealResults
    const resolveWinner = (mId: string) => {
      const matchObj = mId.startsWith('R32-') 
        ? this.r32Matches().find(m => m.id === mId) 
        : this.getMatchByIdStatic(mId, profileId, tempRealResults);
        
      if (!matchObj) return `Ganador ${this.getMatchLabel(mId)}`;

      const res = tempRealResults[mId];
      if (res && res.score1 !== null && res.score2 !== null) {
        const s1 = Number(res.score1);
        const s2 = Number(res.score2);
        if (s1 > s2) return matchObj.home;
        if (s1 < s2) return matchObj.away;
        if (s1 === s2) {
          if (res.penaltyWinner === 1) return matchObj.home;
          if (res.penaltyWinner === 2) return matchObj.away;
        }
      }
      return `Ganador ${this.getMatchLabel(mId)}`;
    };

    const resolveLoser = (mId: string) => {
      const matchObj = this.getMatchByIdStatic(mId, profileId, tempRealResults);
      const winner = resolveWinner(mId);
      if (!matchObj || winner.startsWith('Ganador')) return `Perdedor ${this.getMatchLabel(mId)}`;
      return matchObj.home === winner ? matchObj.away : matchObj.home;
    };

    // 2. Resolver el resto de fases usando la lógica estática/temporal
    if (matchId.startsWith('R16-')) {
      const index = parseInt(matchId.split('-')[1]);
      return {
        id: matchId,
        home: resolveWinner(`R32-${(index * 2) - 1}`),
        away: resolveWinner(`R32-${index * 2}`),
        label: `Octavos Partido ${index}`
      };
    }

    if (matchId.startsWith('QF-')) {
      const index = parseInt(matchId.split('-')[1]);
      return {
        id: matchId,
        home: resolveWinner(`R16-${(index * 2) - 1}`),
        away: resolveWinner(`R16-${index * 2}`),
        label: `Cuartos Partido ${index}`
      };
    }

    if (matchId.startsWith('SF-')) {
      const index = parseInt(matchId.split('-')[1]);
      return {
        id: matchId,
        home: resolveWinner(`QF-${(index * 2) - 1}`),
        away: resolveWinner(`QF-${index * 2}`),
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

  getMatchLabel(matchId: string): string {
    if (matchId.startsWith('R32-')) return `Dieciseisavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('R16-')) return `Octavos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('QF-')) return `Cuartos ${matchId.split('-')[1]}`;
    if (matchId.startsWith('SF-')) return `Semifinal ${matchId.split('-')[1]}`;
    if (matchId === '3RD') return 'Tercer Puesto';
    if (matchId === 'FINAL') return 'Final';
    return matchId;
  }

  getKnockoutWinner(matchId: string, profileId: number | 'real' | 'calendar'): string | null {
    const matchObj = this.getMatchById(matchId);
    if (!matchObj) return null;

    const homeTeamId = matchObj.home;
    const awayTeamId = matchObj.away;

    let score1: number | null = null;
    let score2: number | null = null;
    let penaltyWinner: number | null = null;

    if (profileId === 'real' || profileId === 'calendar') {
      const res = this.realResults()[matchId];
      if (res && res.score1 !== null && res.score2 !== null) {
        score1 = Number(res.score1);
        score2 = Number(res.score2);
        penaltyWinner = res.penaltyWinner ?? null;
      }
    } else {
      const p = this.profiles().find(pr => pr.id === profileId);
      if (p && p.predictions[matchId]) {
        const pred = p.predictions[matchId];
        if (pred.score1 !== null && pred.score2 !== null) {
          score1 = Number(pred.score1);
          score2 = Number(pred.score2);
          penaltyWinner = pred.penaltyWinner ?? null;
        }
      }
    }

    if (score1 === null || score2 === null) return null;

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

  getKnockoutLoser(matchId: string, profileId: number | 'real' | 'calendar'): string | null {
    const winner = this.getKnockoutWinner(matchId, profileId);
    if (!winner) return null;

    const matchObj = this.getMatchById(matchId);
    if (!matchObj) return null;

    if (matchObj.home === winner) return matchObj.away;
    if (matchObj.away === winner) return matchObj.home;
    return null;
  }

  // --- Calculations ---

  calculateStandingsForGroup(groupId: string, profileId: number | 'real' | 'calendar') {
    const teamIds = GROUPS[groupId];
    const standings: Record<string, any> = {};

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
      let score1: number | null = null;
      let score2: number | null = null;

      if (profileId === 'real' || profileId === 'calendar') {
        const res = this.realResults()[match.id];
        if (res && res.score1 !== null && res.score2 !== null) {
          score1 = Number(res.score1);
          score2 = Number(res.score2);
        }
      } else {
        const profile = this.profiles().find(p => p.id === profileId);
        if (profile && profile.predictions[match.id]) {
          const pred = profile.predictions[match.id];
          if (pred.score1 !== null && pred.score2 !== null) {
            score1 = Number(pred.score1);
            score2 = Number(pred.score2);
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

  // --- Leaderboard Scoring Signal ---
  readonly leaderboard = computed<LeaderboardItem[]>(() => {
    const list: LeaderboardItem[] = [];
    const koMatchIds: string[] = [];
    for (let i = 1; i <= 16; i++) koMatchIds.push(`R32-${i}`);
    for (let i = 1; i <= 8; i++) koMatchIds.push(`R16-${i}`);
    for (let i = 1; i <= 4; i++) koMatchIds.push(`QF-${i}`);
    for (let i = 1; i <= 2; i++) koMatchIds.push(`SF-${i}`);
    koMatchIds.push('3RD');
    koMatchIds.push('FINAL');

    const realRes = this.realResults();

    this.profiles().forEach(profile => {
      let points = 0;
      let perfectCount = 0;
      let outcomeCount = 0;
      let failCount = 0;

      // 1. Group Stage
      for (const groupId in MATCHES) {
        MATCHES[groupId].forEach(match => {
          const pred = profile.predictions[match.id];
          const real = realRes[match.id];

          const hasPred = pred && pred.score1 !== null && pred.score2 !== null;
          const hasReal = real && real.score1 !== null && real.score2 !== null;

          if (hasPred && hasReal) {
            const p1 = Number(pred.score1);
            const p2 = Number(pred.score2);
            const r1 = Number(real.score1);
            const r2 = Number(real.score2);

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
          } else if (hasReal) {
            failCount++;
          }
        });
      }

      // 2. Knockouts
      koMatchIds.forEach(mId => {
        const pred = profile.predictions[mId];
        const real = realRes[mId];

        const hasPred = pred && pred.score1 !== null && pred.score2 !== null;
        const hasReal = real && real.score1 !== null && real.score2 !== null;

        if (hasPred && hasReal) {
          const p1 = Number(pred.score1);
          const p2 = Number(pred.score2);
          const r1 = Number(real.score1);
          const r2 = Number(real.score2);

          let isExact = p1 === r1 && p2 === r2;
          if (isExact && p1 === p2) {
            isExact = (pred.penaltyWinner === real.penaltyWinner);
          }

          if (isExact) {
            points += 3;
            perfectCount++;
          } else {
            const predWinner = this.getKnockoutWinner(mId, profile.id);
            const realWinner = this.getKnockoutWinner(mId, 'real');

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

      list.push({
        id: profile.id,
        name: profile.name,
        points: points,
        perfect: perfectCount,
        outcome: outcomeCount,
        fail: failCount
      });
    });

    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.perfect !== a.perfect) return b.perfect - a.perfect;
      return a.name.localeCompare(b.name);
    });

    return list;
  });

  // --- Helper to get team info dynamically ---
  getTeamInfo(teamCode: string): Team & { isPlaceholder?: boolean } {
    if (!teamCode) return { name: 'Por decidir', flag: '', isPlaceholder: true };
    
    // Check if it's a placeholder label
    if (teamCode.includes('Grupo') || teamCode.includes('Partido') || teamCode.includes('Clasificado') || teamCode.includes('Perdedor')) {
      return { name: teamCode, flag: '', isPlaceholder: true };
    }

    const t = TEAMS[teamCode];
    if (t) return t;

    return { name: teamCode, flag: '', isPlaceholder: true };
  }

  // --- External JSON Data Import methods ---
  importProfiles(profilesList: Profile[]) {
    this.profiles.set(profilesList);
    set(ref(this.db, `groups/${this.groupId}/profiles`), profilesList).catch(err => {
      console.error('Error al importar perfiles en Firebase:', err);
    });
  }

  importRealResults(resultsList: Record<string, MatchResult>) {
    this.realResults.set(resultsList);
    set(ref(this.db, 'mundial_global/realResults'), resultsList).catch(err => {
      console.error('Error al importar resultados reales en Firebase:', err);
    });
  }

  async openTeamInfo(teamId: number, teamTla: string) {
    if (!teamId) return;
    this.isTeamInfoModalOpen.set(true);
    this.teamInfoLoading.set(true);
    this.teamInfoError.set(false);
    this.teamInfoData.set(null);
    this.teamInfoActiveTab.set('info');
    this.kitImageError.set(false);

    if (this.teamsCache[teamId]) {
      this.teamInfoData.set(this.teamsCache[teamId]);
      this.teamInfoLoading.set(false);
      return;
    }

    try {
      const response = await fetch(`/api/team?id=${teamId}&tla=${encodeURIComponent(teamTla || '')}`);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error('Dev server returned index.html fallback instead of API response');
      }
      const data = JSON.parse(text);
      this.teamsCache[teamId] = data;
      this.teamInfoData.set(data);
      this.teamInfoLoading.set(false);
    } catch (error) {
      console.warn('API local no disponible, utilizando fallback directo a TheSportsDB...', error);
      // Fallback a TheSportsDB directo
      try {
        const teamRes = await fetch(`https://www.thesportsdb.com/api/v1/json/123/lookupteam.php?id=${teamId}`);
        const playersRes = await fetch(`https://www.thesportsdb.com/api/v1/json/123/lookup_all_players.php?id=${teamId}`);
        
        if (!teamRes.ok) {
          throw new Error('Error al obtener datos de TheSportsDB');
        }
        
        const teamData = await teamRes.json();
        const pData = playersRes.ok ? await playersRes.json() : { player: [] };
        
        if (teamData && teamData.teams && teamData.teams.length > 0) {
          const team = teamData.teams[0];
          const players = (pData.player || []).map((p: any) => ({
            strPlayer: p.strPlayer,
            strPosition: p.strPosition || 'Jugador',
            strJersey: p.strNumber || '',
            strCutout: p.strCutout || p.strThumb || ''
          }));
          
          const consolidated = {
            idTeam: team.idTeam,
            strTeam: team.strTeam,
            strTeamBadge: team.strBadge || team.strTeamBadge || "",
            strDescriptionES: team.strDescriptionES || team.strDescriptionEN || "No hay una descripción disponible.",
            strStadium: team.strStadium || "",
            strStadiumThumb: team.strStadiumThumb || "",
            intStadiumCapacity: team.intStadiumCapacity || "",
            strLocation: team.strLocation || "",
            strEquipment: team.strEquipment || "",
            players: players
          };
          
          this.teamsCache[teamId] = consolidated;
          this.teamInfoData.set(consolidated);
          this.teamInfoLoading.set(false);
        } else {
          throw new Error('Equipo no encontrado en TheSportsDB');
        }
      } catch (fallbackError) {
        console.error('Error en el fallback de TheSportsDB:', fallbackError);
        this.teamInfoError.set(true);
        this.teamInfoLoading.set(false);
      }
    }
  }

  closeTeamInfoModal() {
    this.isTeamInfoModalOpen.set(false);
  }
}
