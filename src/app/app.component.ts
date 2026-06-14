import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { StateService } from './services/state.service';
import { HeaderComponent } from './components/header/header.component';
import { ProfilesNavbarComponent } from './components/profiles-navbar/profiles-navbar.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { GroupStatsComponent } from './components/group-stats/group-stats.component';
import { GroupsViewComponent } from './components/groups-view/groups-view.component';
import { BracketViewComponent } from './components/bracket-view/bracket-view.component';
import { FRIEND_THEMES } from './constants/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ProfilesNavbarComponent,
    LeaderboardComponent,
    GroupStatsComponent,
    GroupsViewComponent,
    BracketViewComponent
  ],
  template: `
    <!-- Contenedor con Fondo Dinamico -->
    <div class="min-h-screen text-slate-100 flex flex-col font-sans transition-all duration-500 relative"
         [ngStyle]="backgroundStyle()">
      
      <!-- Fondo translucido overlay para mejorar contraste -->
      <div class="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none"></div>

      <!-- Spinner de carga inicial a pantalla completa -->
      <div *ngIf="!state.isInitialized()" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-955 text-slate-200">
        <div class="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
        <p class="text-sm font-semibold tracking-wider uppercase text-slate-400">Descargando datos de la quiniela...</p>
      </div>

      <!-- Contenedor Principal de la App -->
      <div *ngIf="state.isInitialized()" class="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        
        <!-- Cabecera -->
        <app-header></app-header>

        <!-- Barra de perfiles de amigos -->
        <app-profiles-navbar></app-profiles-navbar>

        <!-- Selector de fase (Grupos / Eliminatorias) - Oculto si se ve el Calendario -->
        <div *ngIf="state.activeProfileId() !== 'calendar'" class="flex justify-start">
          <div class="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-inner">
            <button (click)="state.activePhase.set('groups')" 
                    class="px-5 py-2 text-sm font-extrabold rounded-xl transition-all duration-200 cursor-pointer outline-none"
                    [ngClass]="state.activePhase() === 'groups' 
                      ? 'bg-primary text-white shadow-md font-bold' 
                      : 'text-slate-400 hover:text-slate-200'">
              Fase de Grupos
            </button>
            <button (click)="state.activePhase.set('knockouts')" 
                    class="px-5 py-2 text-sm font-extrabold rounded-xl transition-all duration-200 cursor-pointer outline-none"
                    [ngClass]="state.activePhase() === 'knockouts' 
                      ? 'bg-primary text-white shadow-md font-bold' 
                      : 'text-slate-400 hover:text-slate-200'">
              Fase Final (Eliminatorias)
            </button>
          </div>
        </div>

        <!-- Layout Central -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Sidebar Izquierdo: Clasificacion y Estadisticas (lg:col-span-3) -->
          <aside class="lg:col-span-3 flex flex-col gap-6 w-full">
            <app-leaderboard></app-leaderboard>
            <app-group-stats></app-group-stats>
          </aside>

          <!-- Seccion Principal: Contenido de Predicciones (lg:col-span-9) -->
          <main class="lg:col-span-9 w-full">
            <!-- Pestaña de Fase de Grupos o Calendario -->
            <app-groups-view *ngIf="state.activePhase() === 'groups' || state.activeProfileId() === 'calendar'"></app-groups-view>
            
            <!-- Pestaña de Fase Final (Bracket) -->
            <app-bracket-view *ngIf="state.activePhase() === 'knockouts' && state.activeProfileId() !== 'calendar'"></app-bracket-view>
          </main>

        </div>

      </div>

      <!-- Modal para Informacion de Seleccion (API fetch) -->
      <div *ngIf="state.isTeamInfoModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div class="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[85vh]">
          
          <!-- Cabecera -->
          <div class="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
            <div class="flex items-center gap-3">
              <img *ngIf="state.teamInfoData()?.strTeamBadge" [src]="state.teamInfoData()?.strTeamBadge" class="w-10 h-10 object-contain animate-pulse" alt="Escudo" loading="lazy">
              <h2 class="text-base font-extrabold text-white">{{ state.teamInfoData()?.strTeam || 'Información de la Selección' }}</h2>
            </div>
            <button (click)="state.closeTeamInfoModal()" class="text-slate-400 hover:text-white text-base font-bold transition-colors duration-150 cursor-pointer">X</button>
          </div>

          <!-- Pestañas internas -->
          <div class="flex border-b border-slate-800 bg-slate-950/30">
            <button (click)="state.teamInfoActiveTab.set('info')" 
                    class="px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2 cursor-pointer outline-none"
                    [ngClass]="state.teamInfoActiveTab() === 'info' ? 'border-purple-500 text-white bg-slate-905/40' : 'border-transparent text-slate-400 hover:text-slate-200'">
              Información
            </button>
            <button (click)="state.teamInfoActiveTab.set('squad')" 
                    class="px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2 cursor-pointer outline-none"
                    [ngClass]="state.teamInfoActiveTab() === 'squad' ? 'border-purple-500 text-white bg-slate-905/40' : 'border-transparent text-slate-400 hover:text-slate-200'">
              Plantilla
            </button>
          </div>

          <!-- Cuerpo -->
          <div class="flex-grow overflow-y-auto p-5 md:p-6 min-h-0">
            <!-- Cargando -->
            <div *ngIf="state.teamInfoLoading()" class="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
              <div class="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
              <p class="text-xs font-semibold tracking-wide uppercase">Descargando información de la selección...</p>
            </div>

            <!-- Error -->
            <div *ngIf="state.teamInfoError()" class="text-center py-12 text-red-400">
              <p class="text-sm font-semibold">No se pudo cargar la información de la selección en este momento.</p>
            </div>

            <!-- Datos -->
            <div *ngIf="!state.teamInfoLoading() && !state.teamInfoError() && state.teamInfoData()" class="h-full">
              <!-- Pestaña Info -->
              <div *ngIf="state.teamInfoActiveTab() === 'info'" class="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-start">
                <div class="md:col-span-7 space-y-3">
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-purple-500 pl-2">Historia y Detalles</h3>
                  <div class="text-xs md:text-sm text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                    {{ state.teamInfoData()?.strDescriptionES }}
                  </div>
                </div>
                
                <div class="md:col-span-5 space-y-4">
                  <!-- Estadio -->
                  <div *ngIf="state.teamInfoData()?.strStadium" class="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <h4 class="text-xs font-extrabold text-white mb-2">{{ state.teamInfoData()?.strStadium }}</h4>
                    <img *ngIf="state.teamInfoData()?.strStadiumThumb" [src]="state.teamInfoData()?.strStadiumThumb" class="w-full h-36 object-cover rounded-lg mb-2 shadow-sm border border-slate-800" alt="Estadio" loading="lazy">
                    <!-- Fallback Estadio Pitch SVG -->
                    <div *ngIf="!state.teamInfoData()?.strStadiumThumb" class="w-full h-36 rounded-lg mb-2 border border-slate-800 bg-slate-900/60 flex items-center justify-center relative overflow-hidden animate-pulse">
                      <svg viewBox="0 0 120 80" class="w-full h-full text-emerald-800/20 stroke-emerald-600/30 fill-none" stroke-width="1.5">
                        <rect x="5" y="5" width="110" height="70" fill="rgba(16, 185, 129, 0.04)" />
                        <line x1="60" y1="5" x2="60" y2="75" />
                        <circle cx="60" cy="40" r="15" />
                        <circle cx="60" cy="40" r="1" fill="currentColor" />
                        <rect x="5" y="20" width="18" height="40" />
                        <rect x="97" y="20" width="18" height="40" />
                        <rect x="5" y="30" width="6" height="20" />
                        <rect x="109" y="30" width="6" height="20" />
                      </svg>
                      <span class="absolute text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estadio</span>
                    </div>
                    <div class="text-[10px] md:text-xs text-slate-400 space-y-1 font-medium">
                      <p>📍 {{ state.teamInfoData()?.strLocation }}</p>
                      <p>👥 Capacidad: {{ state.teamInfoData()?.intStadiumCapacity }}</p>
                    </div>
                  </div>
                  <!-- Equipación -->
                  <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center flex flex-col items-center justify-center min-h-[160px]">
                    <h4 class="text-xs font-extrabold text-white mb-2">Equipación Oficial</h4>
                    <ng-container *ngIf="state.teamInfoData()?.strEquipment && !state.kitImageError(); else svgKit">
                      <img [src]="state.teamInfoData()?.strEquipment" (error)="state.kitImageError.set(true)" class="h-24 object-contain mx-auto" alt="Camiseta" loading="lazy">
                    </ng-container>
                    <ng-template #svgKit>
                      <div class="relative w-24 h-24 flex items-center justify-center bg-slate-900/60 rounded-xl p-2 border border-slate-800/80">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-full h-full drop-shadow-md">
                          <path d="M16,14 L24,6 C26,8 38,8 40,6 L48,14 L58,17 L53,30 L46,26 L46,58 L18,58 L18,26 L11,30 L6,17 Z"
                                [attr.fill]="getTeamColor(state.teamInfoData()?.tla)"
                                stroke="#1e293b" stroke-width="2" />
                        </svg>
                        <img *ngIf="state.teamInfoData()?.strTeamBadge" [src]="state.teamInfoData()?.strTeamBadge" class="absolute w-8 h-8 object-contain top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2" alt="Escudo">
                      </div>
                    </ng-template>
                  </div>
                </div>
              </div>

              <!-- Pestaña Plantilla -->
              <div *ngIf="state.teamInfoActiveTab() === 'squad'" class="space-y-4">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-purple-500 pl-2">Jugadores Convocados</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[45vh] overflow-y-auto pr-2 no-scrollbar">
                  <div *ngFor="let player of state.teamInfoData()?.players" class="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center gap-3 hover:border-purple-500/30 transition-all duration-200">
                    <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img *ngIf="player.strCutout" [src]="player.strCutout" class="w-full h-full object-cover scale-110" [alt]="player.strPlayer" loading="lazy">
                      <span *ngIf="!player.strCutout" class="text-slate-600 font-bold text-base">?</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs md:text-sm font-bold text-white truncate" [title]="player.strPlayer">{{ player.strPlayer }}</p>
                      <p class="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5">{{ player.strPosition }}</p>
                    </div>
                    <span class="ml-auto text-xs md:text-sm font-mono font-bold text-slate-500">#{{ player.strJersey || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AppComponent {
  state = inject(StateService);
  private readonly document = inject(DOCUMENT);

  getTeamColor(tla: string | undefined): string {
    if (!tla) return '#a855f7';
    const colors: Record<string, string> = {
      "MEX": "#127C36", "RSA": "#FFF200", "KOR": "#E10600", "CZE": "#D91A23",
      "CAN": "#FF0000", "BIH": "#002F6C", "QAT": "#8A1538", "SUI": "#D81E05",
      "BRA": "#FEDF00", "MAR": "#C1272D", "SCO": "#002D62", "HAI": "#00209F",
      "USA": "#F8FAFC", "PAR": "#D21034", "AUS": "#FEDF00", "TUR": "#E30A17",
      "GER": "#F8FAFC", "CUW": "#002B7F", "CIV": "#FF8C00", "ECU": "#FEDF00",
      "NED": "#FF4F00", "JPN": "#000080", "SWE": "#FECC00", "TUN": "#E20E17",
      "BEL": "#E30613", "EGY": "#C00404", "IRN": "#F8FAFC", "NZL": "#1E293B",
      "CPV": "#002B7F", "KSA": "#006C35", "ESP": "#C60B1E", "URU": "#4FADDF",
      "FRA": "#002395", "IRQ": "#F8FAFC", "NOR": "#EF2B2D", "SEN": "#F8FAFC",
      "ALG": "#F8FAFC", "ARG": "#75AADB", "AUT": "#ED2939", "JOR": "#F8FAFC",
      "COL": "#FCD116", "COD": "#007FFF", "POR": "#C60B1E", "UZB": "#F8FAFC",
      "ENG": "#F8FAFC", "CRO": "#FF0000", "GHA": "#F8FAFC", "PAN": "#DA121A"
    };
    return colors[tla.toUpperCase()] || '#a855f7';
  }

  constructor() {
    effect(() => {
      const isOpen = this.state.isTeamInfoModalOpen();
      if (isOpen) {
        this.document.body.classList.add('overflow-hidden');
      } else {
        this.document.body.classList.remove('overflow-hidden');
      }
    });
  }

  // Computed Background styles based on selected profile theme matching the legacy app background styles
  readonly backgroundStyle = computed(() => {
    const activeId = this.state.activeProfileId();
    
    if (activeId === 'calendar') {
      return {
        'background-image': "linear-gradient(rgba(6, 7, 12, 0.74), rgba(6, 7, 12, 0.74)), url('assets/fondo.jpg')",
        'background-size': 'cover',
        'background-position': 'center',
        'background-attachment': 'fixed',
        'background-repeat': 'no-repeat',
        'background-color': '#06070c'
      };
    }
    
    if (activeId === 'real') {
      return {
        'background-image': "radial-gradient(circle at 10% 20%, rgba(93, 0, 235, 0.15) 0%, transparent 45%), radial-gradient(circle at 90% 80%, rgba(0, 200, 83, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(24, 42, 122, 0.18) 0%, transparent 60%)",
        'background-size': 'auto',
        'background-position': '0 0',
        'background-attachment': 'fixed',
        'background-repeat': 'no-repeat',
        'background-color': '#05060b'
      };
    }
    
    if (typeof activeId === 'number') {
      const theme = FRIEND_THEMES[activeId];
      if (theme) {
        if (theme.bgImage) {
          return {
            'background-image': `linear-gradient(rgba(6, 7, 12, 0.74), rgba(6, 7, 12, 0.74)), url('${theme.bgImage}')`,
            'background-size': 'cover',
            'background-position': 'center',
            'background-attachment': 'fixed',
            'background-repeat': 'no-repeat',
            'background-color': '#06070c'
          };
        } else {
          return {
            'background-image': theme.gradient,
            'background-attachment': 'fixed',
            'background-repeat': 'no-repeat',
            'background-color': '#06070c'
          };
        }
      }
    }
    
    // Neutral dark background
    return {
      'background-image': 'radial-gradient(circle at 50% 50%, #0f172a, #020617)',
      'background-attachment': 'fixed',
      'background-repeat': 'no-repeat',
    };
  });
}
