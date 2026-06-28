import { Component, ElementRef, ViewChild, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { Match, MatchResult } from '../../models/types';
import { TEAMS } from '../../constants/constants';

@Component({
  selector: 'app-bracket-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full bg-slate-950 border border-slate-900 rounded-3xl p-4 md:p-6 shadow-2xl overflow-hidden">
      
      <!-- Titulo e indicador de perfil -->
      <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <h2 class="text-base md:text-lg font-bold text-white tracking-wide">Fase Final - Cuadro Eliminatorio</h2>
        <span class="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-bold">
          {{ state.activeProfileName() }}
        </span>
      </div>

      <!-- Contenedor del Bracket con scroll y flechas -->
      <div class="relative w-full">
        <!-- Flecha Izquierda -->
        <button *ngIf="showLeftScroll()" (click)="scrollLeft()"
                class="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500 text-amber-400 hover:text-white font-extrabold text-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-200 cursor-pointer">
          &lt;
        </button>

        <!-- Flecha Derecha -->
        <button *ngIf="showRightScroll()" (click)="scrollRight()"
                class="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500 text-amber-400 hover:text-white font-extrabold text-xl shadow-lg hover:shadow-amber-500/20 transition-all duration-200 cursor-pointer">
          &gt;
        </button>

        <!-- Wrapper del Scroll -->
        <div #scrollWrapper (scroll)="updateScrollVisibility()" 
             class="w-full overflow-x-auto no-scrollbar scroll-smooth">
          
          <!-- Contenedor del Arbol (9 columnas con min-w-max para forzar scroll horizontal) -->
          <div class="flex items-stretch gap-6 min-w-max py-6 min-h-[1050px] relative select-none">
            
            <!-- Columna 1: Dieciseisavos Izquierda (R32) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['R32-1', 'R32-2', 'R32-3', 'R32-4', 'R32-5', 'R32-6', 'R32-7', 'R32-8']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

            <!-- Columna 2: Octavos Izquierda (R16) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['R16-1', 'R16-2', 'R16-3', 'R16-4']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

            <!-- Columna 3: Cuartos Izquierda (QF) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['QF-1', 'QF-2']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

            <!-- Columna 4: Semifinales Izquierda (SF-1) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: 'SF-1' }"></ng-container>
            </div>

            <!-- Columna 5: Centro (Final, Copa, Tercer Puesto) -->
            <div class="flex flex-col justify-center gap-12 py-4 w-72 text-center items-center">
              <div>
                <span class="text-xs font-extrabold tracking-widest text-amber-500 uppercase">Final</span>
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: 'FINAL' }"></ng-container>
              </div>

              <!-- Copa del Mundo -->
              <div class="w-40 h-48 flex items-center justify-center relative my-4">
                <div class="absolute inset-0 bg-amber-500/5 blur-2xl rounded-full"></div>
                <img src="assets/copa.png" class="w-28 h-44 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse" alt="Copa del Mundo">
              </div>

              <div>
                <span class="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Tercer Puesto</span>
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: '3RD' }"></ng-container>
              </div>
            </div>

            <!-- Columna 6: Semifinales Derecha (SF-2) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: 'SF-2' }"></ng-container>
            </div>

            <!-- Columna 7: Cuartos Derecha (QF) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['QF-3', 'QF-4']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

            <!-- Columna 8: Octavos Derecha (R16) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['R16-5', 'R16-6', 'R16-7', 'R16-8']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

            <!-- Columna 9: Dieciseisavos Derecha (R32) -->
            <div class="flex flex-col justify-around py-4 w-60">
              <ng-container *ngFor="let mId of ['R32-9', 'R32-10', 'R32-11', 'R32-12', 'R32-13', 'R32-14', 'R32-15', 'R32-16']">
                <ng-container *ngTemplateOutlet="bracketMatchTemplate; context: { matchId: mId }"></ng-container>
              </ng-container>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Template Reutilizable para los partidos del Bracket -->
    <ng-template #bracketMatchTemplate let-matchId="matchId">
      <div class="w-full bg-slate-900/40 hover:bg-slate-900/75 border border-slate-800/80 rounded-2xl p-3 shadow-lg hover:shadow-2xl transition-all duration-200 flex flex-col gap-2 relative border-l-4"
           [class.border-l-amber-500]="isMatchCompleted(matchId)"
           [class.border-l-slate-800]="!isMatchCompleted(matchId)">
        
        <!-- Fecha del partido -->
        <span class="text-[9px] font-bold text-slate-500 tracking-wider uppercase">
          {{ getMatchDateText(matchId) }}
        </span>

        <!-- Fila Local -->
        <div class="flex items-center justify-between gap-1.5" [class.opacity-60]="isPenaltyLoser(matchId, 1)">
          <div class="flex items-center gap-1 min-w-0 flex-grow">
            <img [src]="getTeamFlagUrl(matchId, 1)" class="w-5 h-4 object-cover border border-slate-800/85 rounded-sm flex-shrink-0" alt="Flag" loading="lazy">
            
            <button *ngIf="getTeamSportsDbId(matchId, 1)" 
                    (click)="state.openTeamInfo(getTeamSportsDbId(matchId, 1)!, getTeamCode(matchId, 1))" 
                    class="text-slate-500 hover:text-purple-400 p-0.5 transition-colors duration-150 cursor-pointer outline-none flex-shrink-0" 
                    title="Información de la selección">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 16 16" class="inline-block">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>
            </button>

            <span class="text-xs font-bold text-slate-200 truncate pr-0.5"
                  [ngClass]="{
                    'text-amber-500 cursor-pointer hover:underline': isPenaltySelectable(matchId, 1),
                    'text-emerald-400 font-extrabold': isWinner(matchId, 1)
                  }"
                  (click)="onTeamClick(matchId, 1)"
                  [title]="getTeamName(matchId, 1)">
              {{ getTeamName(matchId, 1) }}
            </span>
          </div>
          <input type="number" min="0" max="99" placeholder="-"
                 [value]="getScoreVal(matchId, 1)"
                 (input)="onScoreInput($event, matchId, 1)"
                 [disabled]="!state.isEditable() || isMatchApiStarted(matchId)"
                 class="w-8 h-7 text-center bg-slate-950 border border-slate-850 rounded-lg text-white font-extrabold text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-100 disabled:bg-slate-950 disabled:border-slate-850">
        </div>

        <!-- Fila Visitante -->
        <div class="flex items-center justify-between gap-1.5" [class.opacity-60]="isPenaltyLoser(matchId, 2)">
          <div class="flex items-center gap-1 min-w-0 flex-grow">
            <img [src]="getTeamFlagUrl(matchId, 2)" class="w-5 h-4 object-cover border border-slate-800/85 rounded-sm flex-shrink-0" alt="Flag" loading="lazy">
            
            <button *ngIf="getTeamSportsDbId(matchId, 2)" 
                    (click)="state.openTeamInfo(getTeamSportsDbId(matchId, 2)!, getTeamCode(matchId, 2))" 
                    class="text-slate-500 hover:text-purple-400 p-0.5 transition-colors duration-150 cursor-pointer outline-none flex-shrink-0" 
                    title="Información de la selección">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="currentColor" viewBox="0 0 16 16" class="inline-block">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>
            </button>

            <span class="text-xs font-bold text-slate-200 truncate pr-0.5"
                  [ngClass]="{
                    'text-amber-500 cursor-pointer hover:underline': isPenaltySelectable(matchId, 2),
                    'text-emerald-400 font-extrabold': isWinner(matchId, 2)
                  }"
                  (click)="onTeamClick(matchId, 2)"
                  [title]="getTeamName(matchId, 2)">
              {{ getTeamName(matchId, 2) }}
            </span>
          </div>
          <input type="number" min="0" max="99" placeholder="-"
                 [value]="getScoreVal(matchId, 2)"
                 (input)="onScoreInput($event, matchId, 2)"
                 [disabled]="!state.isEditable() || isMatchApiStarted(matchId)"
                 class="w-8 h-7 text-center bg-slate-950 border border-slate-850 rounded-lg text-white font-extrabold text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-100 disabled:bg-slate-950 disabled:border-slate-850">
        </div>

        <!-- Feedback puntuacion en quiniela -->
        <div *ngIf="showFeedbackRow(matchId)" class="flex items-center justify-between border-t border-slate-800/50 pt-1.5 mt-0.5 text-[9px]">
          <span class="text-slate-500 font-semibold">Real: {{ getRealScoreText(matchId) }}</span>
          <span class="font-bold px-1.5 py-0.5 rounded" [ngClass]="getFeedbackPointsClass(matchId)">
            {{ getFeedbackPointsText(matchId) }}
          </span>
        </div>
      </div>
    </ng-template>
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
export class BracketViewComponent implements AfterViewInit, OnDestroy {
  state = inject(StateService);

  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef<HTMLDivElement>;

  showLeftScroll = signal<boolean>(false);
  showRightScroll = signal<boolean>(false);

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit() {
    this.setupResizeObserver();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver() {
    const el = this.scrollWrapper.nativeElement;
    this.updateScrollVisibility();

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollVisibility();
      });
      this.resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', () => this.updateScrollVisibility());
    }
  }

  updateScrollVisibility() {
    const el = this.scrollWrapper.nativeElement;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (maxScroll <= 0) {
      this.showLeftScroll.set(false);
      this.showRightScroll.set(false);
      return;
    }

    this.showLeftScroll.set(el.scrollLeft > 10);
    this.showRightScroll.set(el.scrollLeft < maxScroll - 10);
  }

  scrollLeft() {
    this.scrollWrapper.nativeElement.scrollBy({ left: -400, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollWrapper.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  // --- Match Render Helpers ---
  getMatchDateText(matchId: string): string {
    const match = this.state.getMatchById(matchId);
    if (!match) return '';

    const apiMatch = this.state.apiMatchesList().find(m => {
      const h = m.homeTeam?.tla;
      const a = m.awayTeam?.tla;
      return (h === match.home && a === match.away) || (h === match.away && a === match.home);
    });

    if (apiMatch?.utcDate) {
      const isStarted = new Date(apiMatch.utcDate) < new Date();
      if (isStarted) return 'Cerrado';
      
      const matchDate = new Date(apiMatch.utcDate);
      const dayMonth = matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `${dayMonth} - ${timeStr}`;
    }

    return match.label || matchId;
  }

  getTeamName(matchId: string, pos: 1 | 2): string {
    const match = this.state.getMatchById(matchId);
    if (!match) return 'Por decidir';
    const code = pos === 1 ? match.home : match.away;
    return this.state.getTeamInfo(code).name;
  }

  getTeamFlagUrl(matchId: string, pos: 1 | 2): string {
    const match = this.state.getMatchById(matchId);
    if (!match) return 'https://placehold.co/20x15/333/666?text=?';
    const code = pos === 1 ? match.home : match.away;
    const t = this.state.getTeamInfo(code);
    if (t.flag) {
      return `https://flagcdn.com/w20/${t.flag}.png`;
    }
    return 'https://placehold.co/20x15/333/666?text=?';
  }

  isMatchCompleted(matchId: string): boolean {
    const v1 = this.getScoreVal(matchId, 1);
    const v2 = this.getScoreVal(matchId, 2);
    return v1 !== '' && v2 !== '';
  }

  getScoreVal(matchId: string, pos: 1 | 2): string {
    const activeProfile = this.state.activeProfileId();
    if (activeProfile === 'real' || activeProfile === 'calendar') {
      const res = this.state.realResults()[matchId];
      if (res) {
        const val = pos === 1 ? res.score1 : res.score2;
        return val !== null && val !== undefined ? String(val) : '';
      }
    } else {
      const p = this.state.profiles().find(pr => pr.id === activeProfile);
      if (p && p.predictions[matchId]) {
        const pred = p.predictions[matchId];
        const val = pos === 1 ? pred.score1 : pred.score2;
        return val !== null && val !== undefined ? String(val) : '';
      }
    }
    return '';
  }

  onScoreInput(event: Event, matchId: string, pos: 1 | 2) {
    const valueStr = (event.target as HTMLInputElement).value.trim();
    const value = valueStr === '' ? null : Number(valueStr);

    const otherPos = pos === 1 ? 2 : 1;
    const otherValStr = this.getScoreVal(matchId, otherPos);
    const otherVal = otherValStr === '' ? null : Number(otherValStr);

    const score1 = pos === 1 ? value : otherVal;
    const score2 = pos === 2 ? value : otherVal;

    this.state.updateMatchScore(matchId, score1, score2);
  }

  isMatchApiStarted(matchId: string): boolean {
    if (this.state.userRole() === 'admin') return false;
    return !this.state.isMatchPredictionOpen(matchId);
  }

  // Penalty selection checks
  isPenaltySelectable(matchId: string, pos: 1 | 2): boolean {
    if (!this.state.isEditable()) return false;

    const isAdmin = this.state.activeProfileId() === 'real' && this.state.userRole() === 'admin';
    if (!isAdmin && !this.state.isMatchPredictionOpen(matchId)) return false;

    const v1 = this.getScoreVal(matchId, 1);
    const v2 = this.getScoreVal(matchId, 2);
    if (v1 === '' || v2 === '' || Number(v1) !== Number(v2)) return false;

    // Must not be placeholder
    const matchObj = this.state.getMatchById(matchId);
    if (!matchObj) return false;
    const code = pos === 1 ? matchObj.home : matchObj.away;
    const t = this.state.getTeamInfo(code);
    return !t.isPlaceholder;
  }

  onTeamClick(matchId: string, pos: 1 | 2) {
    if (this.isPenaltySelectable(matchId, pos)) {
      this.state.setPenaltyWinner(matchId, pos);
    }
  }

  isWinner(matchId: string, pos: 1 | 2): boolean {
    const winner = this.state.getKnockoutWinner(matchId, this.state.activeProfileId());
    if (!winner) return false;

    const matchObj = this.state.getMatchById(matchId);
    if (!matchObj) return false;
    const code = pos === 1 ? matchObj.home : matchObj.away;
    return winner === code;
  }

  isPenaltyLoser(matchId: string, pos: 1 | 2): boolean {
    // Check if the other team is the winner
    const otherPos = pos === 1 ? 2 : 1;
    return this.isWinner(matchId, otherPos);
  }

  // --- Feedback ---
  showFeedbackRow(matchId: string): boolean {
    const activeProfile = this.state.activeProfileId();
    if (activeProfile === 'real' || activeProfile === 'calendar') return false;
    
    const real = this.state.realResults()[matchId];
    return !!(real && real.score1 !== null && real.score2 !== null);
  }

  getRealScoreText(matchId: string): string {
    const real = this.state.realResults()[matchId];
    if (real && real.score1 !== null && real.score2 !== null) {
      let penText = '';
      if (real.score1 === real.score2 && real.penaltyWinner) {
        const matchObj = this.state.getMatchById(matchId);
        if (matchObj) {
          const code = real.penaltyWinner === 1 ? matchObj.home : matchObj.away;
          const name = this.state.getTeamInfo(code).name;
          penText = ` (Pen. ${name})`;
        }
      }
      return `${real.score1}-${real.score2}${penText}`;
    }
    return '-';
  }

  getFeedbackPointsText(matchId: string): string {
    const pts = this.state.getKnockoutPoints(matchId, this.state.activeProfileId());
    const pred1Str = this.getScoreVal(matchId, 1);
    const pred2Str = this.getScoreVal(matchId, 2);
    if (pred1Str === '' || pred2Str === '') return '0 pts';

    if (pts === 4) return '+4 Exacto';
    if (pts === 3) return '+3 Exacto';
    if (pts === 2) {
      const p1 = Number(pred1Str);
      const p2 = Number(pred2Str);
      const real = this.state.realResults()[matchId];
      const r1 = real ? Number(real.score1) : 0;
      const r2 = real ? Number(real.score2) : 0;
      if (p1 === r1 && p2 === r2) {
        return '+2 Empate';
      }
      return '+2 Ganador';
    }
    if (pts === 1) {
      const p1 = Number(pred1Str);
      const p2 = Number(pred2Str);
      const real = this.state.realResults()[matchId];
      const r1 = real ? Number(real.score1) : 0;
      const r2 = real ? Number(real.score2) : 0;
      if (p1 === p2 && r1 === r2) {
        return '+1 Empate';
      }
      return '+1 Ganador';
    }
    return '0 pts';
  }

  getFeedbackPointsClass(matchId: string): string {
    const text = this.getFeedbackPointsText(matchId);
    if (text.startsWith('+4') || text.startsWith('+3')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (text.startsWith('+2')) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (text.startsWith('+1')) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-red-500/10 text-red-400 border border-red-500/20';
  }

  getTeamCode(matchId: string, pos: 1 | 2): string {
    const match = this.state.getMatchById(matchId);
    if (!match) return '';
    return pos === 1 ? match.home : match.away;
  }

  getTeamSportsDbId(matchId: string, pos: 1 | 2): number | null {
    const code = this.getTeamCode(matchId, pos);
    if (!code) return null;
    const t = this.state.getTeamInfo(code);
    return t.sportsDbId || null;
  }
}
