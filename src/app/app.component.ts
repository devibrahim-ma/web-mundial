import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        <div class="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[85vh]">
          
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
              <div *ngIf="state.teamInfoActiveTab() === 'info'" class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start">
                <div class="space-y-3">
                  <h3 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-purple-500 pl-2">Historia y Detalles</h3>
                  <div class="text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto pr-2 no-scrollbar">
                    {{ state.teamInfoData()?.strDescriptionES }}
                  </div>
                </div>
                
                <div class="space-y-4">
                  <!-- Estadio -->
                  <div *ngIf="state.teamInfoData()?.strStadium" class="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    <h4 class="text-xs font-extrabold text-white mb-2">{{ state.teamInfoData()?.strStadium }}</h4>
                    <img *ngIf="state.teamInfoData()?.strStadiumThumb" [src]="state.teamInfoData()?.strStadiumThumb" class="w-full h-32 object-cover rounded-lg mb-2 shadow-sm border border-slate-800" alt="Estadio" loading="lazy">
                    <div class="text-[10px] text-slate-400 space-y-1 font-medium">
                      <p>📍 {{ state.teamInfoData()?.strLocation }}</p>
                      <p>👥 Capacidad: {{ state.teamInfoData()?.intStadiumCapacity }}</p>
                    </div>
                  </div>
                  <!-- Equipación -->
                  <div *ngIf="state.teamInfoData()?.strEquipment" class="bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-center">
                    <h4 class="text-xs font-extrabold text-white mb-2">Equipación Oficial</h4>
                    <img [src]="state.teamInfoData()?.strEquipment" class="h-24 object-contain mx-auto" alt="Camiseta" loading="lazy">
                  </div>
                </div>
              </div>

              <!-- Pestaña Plantilla -->
              <div *ngIf="state.teamInfoActiveTab() === 'squad'" class="space-y-4">
                <h3 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-purple-500 pl-2">Jugadores Convocados</h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                  <div *ngFor="let player of state.teamInfoData()?.players" class="bg-slate-950/40 p-2 rounded-xl border border-slate-850 flex items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img *ngIf="player.strCutout" [src]="player.strCutout" class="w-full h-full object-cover" [alt]="player.strPlayer" loading="lazy">
                      <span *ngIf="!player.strCutout" class="text-slate-600 font-bold text-xs">?</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[11px] font-bold text-white truncate" [title]="player.strPlayer">{{ player.strPlayer }}</p>
                      <p class="text-[9px] text-slate-500 font-semibold">{{ player.strPosition }}</p>
                    </div>
                    <span class="ml-auto text-[10px] font-mono font-bold text-slate-500">#{{ player.strJersey || '-' }}</span>
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
