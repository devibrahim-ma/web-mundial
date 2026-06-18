import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { GROUP_IDS, MATCHES, PROFILE_AVATARS } from '../../constants/constants';
import { Match, MatchResult } from '../../models/types';

@Component({
  selector: 'app-groups-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
 
      <!-- Selector de Pestañas de Grupo (A-L) - Siempre visible -->
      <div class="w-full overflow-x-auto no-scrollbar scroll-smooth">
        <div class="flex items-center gap-2 pb-1 min-w-max">
          <button *ngFor="let gId of groupIds" 
                  (click)="selectGroup(gId)" 
                  class="px-4 py-2 text-sm font-extrabold rounded-xl border transition-all duration-150 shadow-inner cursor-pointer"
                  [ngClass]="state.activeGroupId() === gId 
                    ? 'bg-primary text-white border-primary scale-105 shadow-md shadow-purple-500/10' 
                    : 'bg-slate-900/30 border-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'">
            Grupo {{ gId }}
          </button>
        </div>
      </div>
 
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Columna Partidos / Calendario (lg:col-span-8) -->
        <div class="lg:col-span-8 space-y-4">
          
          <!-- VISTA CALENDARIO CRONOLOGICO -->
          <div *ngIf="state.activeProfileId() === 'calendar'" class="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 shadow-xl glass-card">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
              <h2 class="text-lg font-bold text-white tracking-wide">Calendario de Partidos</h2>
              <span class="text-xs bg-slate-950 text-slate-400 border border-slate-850 px-3 py-1 rounded-full font-semibold">
                {{ calendarProgressText() }}
              </span>
            </div>
 
            <div *ngIf="state.apiMatchesList().length === 0" class="text-center py-12 text-slate-500 space-y-4">
              <p>Aun no se han cargado los partidos desde la API.</p>
              <button (click)="state.syncApiResultsForce()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-sm transition-colors duration-150 cursor-pointer">
                Sincronizar ahora
              </button>
            </div>
 
            <div *ngIf="state.apiMatchesList().length > 0" class="space-y-4">
              <!-- Pagina Anterior -->
              <div *ngIf="showPrevCalendarBtn()" class="flex justify-center">
                <button (click)="prevCalendar()" 
                        class="px-4 py-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-bold rounded-xl transition-colors duration-150 cursor-pointer">
                  Mostrar partidos anteriores
                </button>
              </div>
 
              <!-- Lista de Partidos del Calendario -->
              <div class="space-y-3">
                <div *ngFor="let apiMatch of getVisibleCalendarMatches()" 
                     class="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 hover:bg-slate-900/25 transition-all duration-200">
                  
                  <!-- Info Fecha y Hora -->
                  <div class="flex md:flex-col items-center justify-between md:justify-center w-full md:w-36 gap-1 border-b md:border-b-0 md:border-r border-slate-850 pb-2 md:pb-0 md:pr-4">
                    <span class="text-xs font-bold text-slate-200">{{ formatApiMatchDate(apiMatch.utcDate) }}</span>
                    <span class="text-xs text-slate-400 font-semibold">{{ formatApiMatchTime(apiMatch.utcDate) }}</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-1" [ngClass]="getApiStatusClass(apiMatch.status)">
                      {{ getApiStatusText(apiMatch.status) }}
                    </span>
                  </div>
 
                  <!-- Equipos y Marcador -->
                  <div class="flex items-center justify-between flex-grow w-full gap-4">
                    <!-- Local -->
                    <div class="flex items-center justify-end gap-3 flex-1 text-right">
                      <span class="text-sm font-bold text-slate-200 truncate max-w-[120px] sm:max-w-none">
                        <span class="hidden sm:inline">{{ getTeamName(apiMatch.homeTeam?.tla) }}</span>
                        <span class="inline sm:hidden">{{ getTeamAbbreviation(apiMatch.homeTeam?.tla) }}</span>
                      </span>
                      <img [src]="getTeamFlagUrl(apiMatch.homeTeam?.tla)" class="w-8 h-6 object-cover border border-slate-800 rounded-md shadow-sm" [alt]="apiMatch.homeTeam?.name" loading="lazy">
                    </div>
 
                    <!-- Marcador -->
                    <div class="flex items-center gap-3 px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-xl">
                      <span class="text-base font-extrabold text-white w-5 text-center">{{ apiMatch.score?.fullTime?.home ?? '-' }}</span>
                      <span class="text-xs font-semibold text-slate-655">vs</span>
                      <span class="text-base font-extrabold text-white w-5 text-center">{{ apiMatch.score?.fullTime?.away ?? '-' }}</span>
                    </div>
 
                    <!-- Visitante -->
                    <div class="flex items-center justify-start gap-3 flex-1 text-left">
                      <img [src]="getTeamFlagUrl(apiMatch.awayTeam?.tla)" class="w-8 h-6 object-cover border border-slate-800 rounded-md shadow-sm" [alt]="apiMatch.awayTeam?.name" loading="lazy">
                      <span class="text-sm font-bold text-slate-200 truncate max-w-[120px] sm:max-w-none">
                        <span class="hidden sm:inline">{{ getTeamName(apiMatch.awayTeam?.tla) }}</span>
                        <span class="inline sm:hidden">{{ getTeamAbbreviation(apiMatch.awayTeam?.tla) }}</span>
                      </span>
                    </div>
                  </div>
 
                </div>
              </div>
 
              <!-- Pagina Siguiente -->
              <div *ngIf="showNextCalendarBtn()" class="flex justify-center">
                <button (click)="nextCalendar()" 
                        class="px-4 py-2 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/60 text-xs text-slate-400 font-bold rounded-xl transition-colors duration-150 cursor-pointer">
                  Mostrar próximos partidos
                </button>
              </div>
            </div>
          </div>
 
          <!-- VISTA FASE DE GRUPOS NORMAL -->
          <div *ngIf="state.activeProfileId() !== 'calendar'" class="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 shadow-xl glass-card">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 class="text-lg font-bold text-white tracking-wide">Grupo {{ state.activeGroupId() }} - Partidos</h2>
            </div>
 
            <!-- Lista de Partidos -->
            <div class="space-y-3">
              <div *ngFor="let match of getGroupMatches()" 
                   class="p-4 bg-slate-950/20 border border-slate-800/40 rounded-xl hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 hover:bg-slate-900/25 transition-all duration-200 flex flex-col gap-3">
                
                <!-- Fila de Prediccion / Marcador -->
                <div class="flex items-center justify-between gap-2">
                  <!-- Local -->
                  <div class="flex items-center justify-end gap-2 flex-1 text-right">
                    <span class="text-sm font-bold text-slate-200 truncate max-w-[80px] sm:max-w-none">
                      <span class="hidden sm:inline">{{ getTeamName(match.home) }}</span>
                      <span class="inline sm:hidden">{{ getTeamAbbreviation(match.home) }}</span>
                    </span>
                    <img [src]="getTeamFlagUrl(match.home)" class="w-8 h-6 object-cover border border-slate-800 rounded-md shadow-sm" [alt]="match.home" loading="lazy">
                  </div>
 
                  <!-- Marcador -->
                  <div class="flex items-center gap-1.5">
                    <input type="number" min="0" max="99" placeholder="-"
                           [value]="getScoreVal(match.id, 1)"
                           (input)="onScoreInput($event, match.id, 1)"
                           [disabled]="!state.isEditable() || isMatchApiStarted(match.id)"
                           class="w-10 sm:w-12 h-9 text-center bg-slate-950 border border-slate-850 rounded-xl text-white font-extrabold focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all duration-150 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-100 disabled:bg-slate-950 disabled:border-slate-850">
                    
                    <span class="text-xs font-semibold text-slate-655">vs</span>
                    
                    <input type="number" min="0" max="99" placeholder="-"
                           [value]="getScoreVal(match.id, 2)"
                           (input)="onScoreInput($event, match.id, 2)"
                           [disabled]="!state.isEditable() || isMatchApiStarted(match.id)"
                           class="w-10 sm:w-12 h-9 text-center bg-slate-950 border border-slate-850 rounded-xl text-white font-extrabold focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all duration-150 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-100 disabled:bg-slate-950 disabled:border-slate-850">
                  </div>
 
                  <!-- Visitante -->
                  <div class="flex items-center justify-start gap-2 flex-1 text-left">
                    <img [src]="getTeamFlagUrl(match.away)" class="w-8 h-6 object-cover border border-slate-800 rounded-md shadow-sm" [alt]="match.away" loading="lazy">
                    <span class="text-sm font-bold text-slate-200 truncate max-w-[80px] sm:max-w-none">
                      <span class="hidden sm:inline">{{ getTeamName(match.away) }}</span>
                      <span class="inline sm:hidden">{{ getTeamAbbreviation(match.away) }}</span>
                    </span>
                  </div> 
                </div>

                <!-- Feedback de Puntuacion Real (si no es perfil real y existe resultado) -->
                <div *ngIf="showFeedbackRow(match.id)" class="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
                  <span class="text-slate-500 font-semibold">
                    Resultado Real: <strong class="text-amber-400 font-extrabold ml-1">{{ getRealScoreText(match.id) }}</strong>
                  </span>
                  <span class="font-bold px-2.5 py-1 rounded-xl text-[10px]" [ngClass]="getFeedbackPointsClass(match.id)">
                    {{ getFeedbackPointsText(match.id) }}
                  </span>
                </div>
              </div>
 
            </div>
          </div>
 
        </div> <!-- Closes lg:col-span-8 matches column -->
 
        <!-- Columna Clasificacion (lg:col-span-4) -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 shadow-xl glass-card">
            <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 class="text-lg font-bold text-white tracking-wide">Clasificacion del Grupo</h2>
              <span class="text-xs bg-slate-950 border border-slate-800/60 px-3 py-1 rounded-xl font-bold"
                    [class.text-amber-400]="state.activeProfileId() === 'real' || state.activeProfileId() === 'calendar'"
                    [class.text-purple-400]="state.activeProfileId() !== 'real' && state.activeProfileId() !== 'calendar'">
                {{ state.activeProfileName() }}
              </span>
            </div>
 
            <!-- Tabla de Posiciones -->
            <div class="overflow-x-auto no-scrollbar">
              <table class="w-full text-center border-collapse">
                <thead>
                  <tr class="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">
                    <th class="py-2.5 text-left pl-1">Pos</th>
                    <th class="py-2.5 text-left">Equipo</th>
                    <th class="py-2.5">PJ</th>
                    <th class="py-2.5">G</th>
                    <th class="py-2.5">E</th>
                    <th class="py-2.5">P</th>
                    <th class="py-2.5">GF</th>
                    <th class="py-2.5">GC</th>
                    <th class="py-2.5 text-right pr-1">Pts</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/40">
                  <tr *ngFor="let stand of getGroupStandings(); let idx = index" 
                      class="text-xs hover:bg-slate-800/20 transition-colors duration-150 border-l-4"
                      [ngClass]="{
                        'border-l-purple-500': idx === 0 || idx === 1,
                        'border-l-cyan-500': idx === 2,
                        'border-l-red-500/10': idx === 3
                      }">
                    <td class="py-3 text-left pl-1 text-slate-400 font-bold">{{ idx + 1 }}</td>
                    <td class="py-3 text-left">
                      <div class="flex items-center gap-2">
                        <img [src]="getTeamFlagUrl(stand.teamId)" class="w-5 h-4 object-cover border border-slate-800/40 rounded-sm" [alt]="stand.teamId" loading="lazy">
                        <span class="font-bold text-slate-200 truncate max-w-[80px] sm:max-w-none">
                          <span class="hidden sm:inline">{{ getTeamName(stand.teamId) }}</span>
                          <span class="inline sm:hidden">{{ getTeamAbbreviation(stand.teamId) }}</span>
                        </span>
                        <button *ngIf="state.getTeamInfo(stand.teamId).sportsDbId" 
                                (click)="state.openTeamInfo(state.getTeamInfo(stand.teamId).sportsDbId!, stand.teamId)" 
                                class="text-slate-500 hover:text-purple-400 p-0.5 transition-colors duration-150 cursor-pointer outline-none" 
                                title="Información de la selección">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" class="inline-block">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="py-3 text-slate-350 font-semibold">{{ stand.pld }}</td>
                    <td class="py-3 text-slate-400">{{ stand.w }}</td>
                    <td class="py-3 text-slate-400">{{ stand.d }}</td>
                    <td class="py-3 text-slate-400">{{ stand.l }}</td>
                    <td class="py-3 text-slate-350 font-semibold">{{ stand.gf }}</td>
                    <td class="py-3 text-slate-400">{{ stand.ga }}</td>
                    <td class="py-3 text-right font-extrabold pr-1 text-purple-400">{{ stand.pts }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
 
            <!-- Reglas de desempate -->
            <div class="border-t border-slate-800/60 pt-3 mt-4 text-[10px] text-slate-550 font-medium leading-relaxed">
              Criterios de desempate simulados: 1. Puntos, 2. Diferencia de goles, 3. Goles a favor, 4. Alfabetico.
            </div>
          </div>
        </div> <!-- Closes lg:col-span-4 standings column -->
 
      </div> <!-- Closes grid container -->
 
    </div> <!-- Closes space-y-6 main wrapper -->
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class GroupsViewComponent {
  state = inject(StateService);

  readonly groupIds = GROUP_IDS;

  selectGroup(groupId: string) {
    this.state.activeGroupId.set(groupId);
  }

  getGroupMatches(): Match[] {
    return MATCHES[this.state.activeGroupId()] || [];
  }

  getGroupStandings(): any[] {
    const activeGroup = this.state.activeGroupId();
    const standingsMap = this.state.allGroupStandings();
    return standingsMap[activeGroup] || [];
  }

  isMatchCompleted(matchId: string): boolean {
    const val1 = this.getScoreVal(matchId, 1);
    const val2 = this.getScoreVal(matchId, 2);
    return val1 !== '' && val2 !== '';
  }

  getScoreVal(matchId: string, teamPos: 1 | 2): string {
    const activeProfile = this.state.activeProfileId();
    if (activeProfile === 'real' || activeProfile === 'calendar') {
      const res = this.state.realResults()[matchId];
      if (res) {
        const val = teamPos === 1 ? res.score1 : res.score2;
        return val !== null && val !== undefined ? String(val) : '';
      }
    } else {
      const p = this.state.profiles().find(pr => pr.id === activeProfile);
      if (p && p.predictions[matchId]) {
        const pred = p.predictions[matchId];
        const val = teamPos === 1 ? pred.score1 : pred.score2;
        return val !== null && val !== undefined ? String(val) : '';
      }
    }
    return '';
  }

  onScoreInput(event: Event, matchId: string, teamPos: 1 | 2) {
    const valueStr = (event.target as HTMLInputElement).value.trim();
    const value = valueStr === '' ? null : Number(valueStr);

    const otherPos = teamPos === 1 ? 2 : 1;
    const otherValStr = this.getScoreVal(matchId, otherPos);
    const otherVal = otherValStr === '' ? null : Number(otherValStr);

    const score1 = teamPos === 1 ? value : otherVal;
    const score2 = teamPos === 2 ? value : otherVal;

    this.state.updateMatchScore(matchId, score1, score2);
  }

  isMatchApiStarted(matchId: string): boolean {
    return this.state.isMatchStarted(matchId);
  }

  getMatchScheduleText(matchId: string): string {
    const localMatch = MATCHES[this.state.activeGroupId()]?.find(m => m.id === matchId);
    if (!localMatch) return '';
    
    const apiMatch = this.state.apiMatchesList().find(m => {
      const h = m.homeTeam?.tla;
      const a = m.awayTeam?.tla;
      return (h === localMatch.home && a === localMatch.away) || (h === localMatch.away && a === localMatch.home);
    });

    if (apiMatch?.utcDate) {
      const isStarted = new Date(apiMatch.utcDate) < new Date();
      if (isStarted) return 'Cerrado';
      
      const matchDate = new Date(apiMatch.utcDate);
      let weekday = matchDate.toLocaleDateString('es-ES', { weekday: 'short' });
      weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${weekday}, ${dayMonth} - ${timeStr}`;
    }
    return 'Programado';
  }

  progressBadgeText(): string {
    const matches = this.getGroupMatches();
    let count = 0;
    matches.forEach(m => {
      if (this.isMatchCompleted(m.id)) count++;
    });
    return `${count}/6 Pronosticos`;
  }



  // --- Feedback Logic ---
  showFeedbackRow(matchId: string): boolean {
    const activeProfile = this.state.activeProfileId();
    if (activeProfile === 'real' || activeProfile === 'calendar') return false;
    
    const real = this.state.realResults()[matchId];
    return !!(real && real.score1 !== null && real.score2 !== null);
  }

  getRealScoreText(matchId: string): string {
    const real = this.state.realResults()[matchId];
    if (real && real.score1 !== null && real.score2 !== null) {
      return `${real.score1} - ${real.score2}`;
    }
    return '-';
  }

  getFeedbackPointsText(matchId: string): string {
    const pred1Str = this.getScoreVal(matchId, 1);
    const pred2Str = this.getScoreVal(matchId, 2);
    if (pred1Str === '' || pred2Str === '') return '0 puntos';

    const p1 = Number(pred1Str);
    const p2 = Number(pred2Str);

    const real = this.state.realResults()[matchId];
    if (real && real.score1 !== null && real.score2 !== null) {
      const r1 = Number(real.score1);
      const r2 = Number(real.score2);

      if (p1 === r1 && p2 === r2) return '+3 puntos (Exacto)';

      const predDiff = p1 - p2;
      const realDiff = r1 - r2;
      const predOutcome = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
      const realOutcome = realDiff > 0 ? 1 : (realDiff < 0 ? -1 : 0);

      if (predOutcome === realOutcome) return '+1 punto (Acierto)';
    }

    return '0 puntos';
  }

  getFeedbackPointsClass(matchId: string): string {
    const text = this.getFeedbackPointsText(matchId);
    if (text.startsWith('+3')) {
      return 'bg-emerald-500 text-slate-950 font-extrabold border border-emerald-400 shadow-sm shadow-emerald-500/20';
    }
    if (text.startsWith('+1')) {
      return 'bg-yellow-500 text-slate-950 font-extrabold border border-yellow-400 shadow-sm shadow-yellow-500/10';
    }
    return 'bg-slate-950/80 text-slate-500 border border-slate-900';
  }

  // --- Calendar visibility and navigation ---
  calendarProgressText(): string {
    const total = this.state.apiMatchesList().length;
    const finished = this.state.apiMatchesList().filter(m => m.status === 'FINISHED').length;
    return `${finished}/${total} Jugados`;
  }

  showPrevCalendarBtn(): boolean {
    const start = this.state.calendarVisibleStart();
    return start !== null && start > 0;
  }

  showNextCalendarBtn(): boolean {
    const end = this.state.calendarVisibleEnd();
    const list = this.state.apiMatchesList();
    return end !== null && list.length > 0 && end < list.length - 1;
  }

  getVisibleCalendarMatches(): any[] {
    const list = [...this.state.apiMatchesList()];
    list.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
    
    let start = this.state.calendarVisibleStart();
    let end = this.state.calendarVisibleEnd();

    if (start === null || end === null || start >= list.length || end >= list.length) {
      setTimeout(() => {
        this.initializeCalendarRangeStatic(list);
      });
      return list.slice(0, 5);
    }

    if (start !== null && end !== null) {
      return list.slice(start, end + 1);
    }
    return list.slice(0, 5);
  }

  private initializeCalendarRangeStatic(list: any[]) {
    if (list.length === 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayIndices: number[] = [];
    list.forEach((m, idx) => {
      const mDateStr = new Date(m.utcDate).toISOString().split('T')[0];
      if (mDateStr === todayStr) {
        todayIndices.push(idx);
      }
    });

    if (todayIndices.length > 0) {
      this.state.calendarVisibleStart.set(todayIndices[0]);
      this.state.calendarVisibleEnd.set(todayIndices[todayIndices.length - 1]);
    } else {
      const now = Date.now();
      let closestIdx = 0;
      let minDiff = Infinity;
      list.forEach((m, idx) => {
        const diff = Math.abs(new Date(m.utcDate).getTime() - now);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      const closestDateStr = new Date(list[closestIdx].utcDate).toISOString().split('T')[0];
      const pivotIndices: number[] = [];
      list.forEach((m, idx) => {
        const mDateStr = new Date(m.utcDate).toISOString().split('T')[0];
        if (mDateStr === closestDateStr) {
          pivotIndices.push(idx);
        }
      });

      this.state.calendarVisibleStart.set(pivotIndices[0]);
      this.state.calendarVisibleEnd.set(pivotIndices[pivotIndices.length - 1]);
    }
  }

  prevCalendar() {
    const start = this.state.calendarVisibleStart();
    if (start !== null) {
      const nextStart = Math.max(0, start - 3);
      this.state.calendarVisibleStart.set(nextStart);
    }
  }

  nextCalendar() {
    const end = this.state.calendarVisibleEnd();
    const listLen = this.state.apiMatchesList().length;
    if (end !== null && listLen > 0) {
      const nextEnd = Math.min(listLen - 1, end + 3);
      this.state.calendarVisibleEnd.set(nextEnd);
    }
  }

  formatApiMatchDate(dateString: string): string {
    const matchDate = new Date(dateString);
    let weekday = matchDate.toLocaleDateString('es-ES', { weekday: 'long' });
    weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    return `${weekday}, ${dayMonth}`;
  }

  formatApiMatchTime(dateString: string): string {
    const matchDate = new Date(dateString);
    return matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getApiStatusText(status: string): string {
    if (status === 'FINISHED') return 'Finalizado';
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'En Vivo';
    return 'Programado';
  }

  getApiStatusClass(status: string): string {
    if (status === 'FINISHED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'IN_PLAY' || status === 'PAUSED') return 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  getTeamName(teamCode: string): string {
    return this.state.getTeamInfo(teamCode).name;
  }

  getTeamAbbreviation(teamCode: string): string {
    if (!teamCode) return '';
    const t = this.state.getTeamInfo(teamCode);
    if (t.isPlaceholder) {
      return t.name;
    }
    return this.state.normalizeTLA(teamCode);
  }

  getTeamFlagUrl(teamCode: string): string {
    const t = this.state.getTeamInfo(teamCode);
    if (t.flag) {
      return `https://flagcdn.com/w40/${t.flag}.png`;
    }
    return 'https://placehold.co/40x30/333/666?text=?';
  }
}
