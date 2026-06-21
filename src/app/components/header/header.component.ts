import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { PROFILE_AVATARS } from '../../constants/constants';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Banner de España en Vivo -->
    <div *ngIf="state.isSpainEventActive()" 
         class="w-full bg-gradient-to-r from-red-650 via-yellow-555 to-red-650 text-white text-xs font-black py-2.5 px-4 mb-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 relative overflow-hidden select-none border border-red-500/30">
      <img src="https://flagcdn.com/w40/es.png" class="w-5 h-3.5 object-cover rounded-sm shadow-sm inline animate-bounce" alt="España">
      <span>¡EVENTO EN VIVO: JUEGA LA ROJA! Apoya a la selección y celebra cada jugada.</span>
      <img src="https://flagcdn.com/w40/es.png" class="w-5 h-3.5 object-cover rounded-sm shadow-sm inline animate-bounce" alt="España">
    </div>

    <header class="relative w-full py-4 flex flex-col items-center justify-center text-center">
      
      <!-- Logo and Title Info -->
      <div class="flex items-center gap-4 justify-center">
        <div class="relative w-20 h-20 flex items-center justify-center overflow-visible">
          <img src="assets/ball.png" class="w-18 h-18 object-contain animate-spin-slow ball-glow" alt="Balon 2026" style="width:4.5rem;height:4.5rem;" [ngClass]="{'ball-glow-spain': state.isSpainEventActive()}">
        </div>
        <div class="text-left">
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-wide leading-none">
            <span class="text-white">Mundial </span><span style="color: #FFD700;">2026</span>
          </h1>
          <p class="text-xs md:text-sm text-slate-400 font-semibold mt-1">
            Quiniela & Predicciones <span class="text-purple-400 font-bold">{{ state.groupName() }}</span>
            <span *ngIf="state.userRole() === 'admin'" class="ml-2 text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>
          </p>
          <div class="flex items-center gap-1.5 mt-1.5">
            <span class="w-2 h-2 rounded-full shadow-lg" [ngClass]="getSyncDotClass()"></span>
            <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{{ state.apiSyncStatus() }}</span>
          </div>
        </div>
      </div>

      <!-- Actions (Music, Share, Admin Actions) -->
      <div class="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 flex flex-wrap items-center justify-center gap-3 mt-4 md:mt-0">
        
        <!-- Toggle Simulación España (Solo Admin) -->
        <button *ngIf="state.userRole() === 'admin'" (click)="toggleSpainSimulation()" 
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-md select-none outline-none"
                [ngClass]="state.isSpainEventSimulated() 
                  ? 'bg-red-700 hover:bg-red-800 border-red-500 text-white shadow-red-650/20' 
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'">
          <img src="https://flagcdn.com/w40/es.png" class="w-4 h-3 object-cover rounded-sm inline mr-0.5" alt="España">
          <span>{{ state.isSpainEventSimulated() ? 'Simulación Activa' : 'Simular España' }}</span>
        </button>

        <!-- Music Player controls -->
        <div class="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button (click)="toggleMusic()" class="p-1 text-slate-400 hover:text-white transition-colors duration-200" [title]="isMuted() ? 'Activar Musica' : 'Desactivar Musica'">
            <!-- SVG Speaker Muted -->
            <svg *ngIf="isMuted()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" class="text-slate-500">
              <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <!-- SVG Speaker Playing -->
            <svg *ngIf="!isMuted()" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" class="text-purple-400">
              <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
              <path d="M9.778 12.25a5.5 5.5 0 0 0 1.625-3.905c0-1.52-.619-2.897-1.625-3.905l-.708.707a4.5 4.5 0 0 1 1.33 3.198c0 1.24-.5 2.365-1.33 3.198z"/>
              <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
            </svg>
          </button>
          <input type="range" min="0" max="1" step="0.05" [(ngModel)]="volume" (input)="updateVolume()" 
                 class="w-16 md:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer volume-slider" title="Volumen">
        </div>

        <!-- Share button -->
        <button (click)="shareGroup()" class="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg hover:shadow-purple-600/20 transition-all duration-200 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
          </svg>
          <span class="text-xs">Compartir</span>
        </button>

        <!-- Edit Profiles (Admin only) -->
        <button *ngIf="state.userRole() === 'admin'" (click)="openEditModal()" class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl shadow-md transition-all duration-200 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.5-.5V9h-.5a.5.5 0 0 1-.5-.5V8h-.5a.5.5 0 0 1-.5-.5V7h-.5a.5.5 0 0 0-.146-.354L1.3 5.793V6.5a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .146-.354l.5-.5a.5.5 0 0 1 .354-.146H1.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207L1.3 12H1.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l-.146.146zm-6 1.5a.5.5 0 0 1-.708 0l-.5-.5a.5.5 0 0 1 0-.708l.5-.5a.5.5 0 0 1 .708 0l.5.5a.5.5 0 0 1 0 .708z"/>
          </svg>
          <span class="text-xs">Editar Amigos</span>
        </button>

        <!-- Data dropdown actions (Admin only) -->
        <div class="relative" *ngIf="state.userRole() === 'admin'">
          <button (click)="toggleDropdown()" class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl shadow-md transition-all duration-200 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1.5a.5.5 0 0 1-1 0V11a.5.5 0 0 1 .146-.354l.5-.5a.5.5 0 0 1 .708 0l.5.5A.5.5 0 0 1 13 11m-8.5-2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H4.5a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1z"/>
              <path d="M13.5 1a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H11v-1h2.5a.5.5 0 0 0 .5-.5V2.5a.5.5 0 0 0-.5-.5H2.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 .5.5H5v1H2.5A1.5 1.5 0 0 1 1 11.5v-8.5A1.5 1.5 0 0 1 2.5 1H10V.5a.5.5 0 0 1 1 0V1z"/>
            </svg>
            <span class="text-xs">Datos</span>
          </button>
          
          <div *ngIf="isDropdownOpen()" class="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-down">
            <button (click)="exportData()" class="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-colors duration-150">Exportar Copia (JSON)</button>
            <label class="block w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-850 hover:text-white transition-colors duration-150 cursor-pointer">
              Importar Copia (JSON)
              <input type="file" (change)="importData($event)" accept=".json" class="hidden">
            </label>
            <button (click)="resetAll()" class="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150 border-t border-slate-800">Reiniciar Todo</button>
          </div>
        </div>

        <!-- Logout button -->
        <button (click)="state.logout()" class="flex items-center gap-2 px-4 py-2 bg-slate-950/60 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl shadow-md transition-all duration-200 cursor-pointer" title="Cerrar Sesión">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z"/>
            <path fill-rule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
          </svg>
          <span class="text-xs">Cerrar Sesión</span>
        </button>
      </div>
    </header>

    <!-- Invisible Audio player -->
    <audio #audioPlayer src="assets/mundial_theme.mp3" loop></audio>

    <!-- Modal for editing profile names -->
    <div *ngIf="isEditModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md bg-slate-905 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-card">
        <div class="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
          <h2 class="text-base font-bold text-white">Editar Nombres de Amigos</h2>
          <button (click)="closeEditModal()" class="text-slate-400 hover:text-white text-lg font-bold transition-colors duration-150">X</button>
        </div>
        
        <form (ngSubmit)="saveProfileNames()" class="p-5 space-y-4">
          <div class="max-h-60 overflow-y-auto pr-2 space-y-3">
            <div *ngFor="let prof of tempProfileNames; let i = index" class="flex items-center gap-3 bg-slate-950/40 p-2 rounded-xl border border-slate-850">
              <img [src]="getAvatar(i)" class="w-8 h-8 rounded-full border border-slate-800 object-cover" alt="Avatar">
              <div class="flex-grow">
                <input type="text" [(ngModel)]="tempProfileNames[i]" [name]="'friend-' + i" 
                       class="w-full bg-slate-950 text-white border border-slate-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-lg px-3 py-1.5 text-xs outline-none transition-all duration-150" 
                       required maxlength="15">
              </div>
              <span class="text-xs text-slate-500 font-mono font-bold">#{{ i + 1 }}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 bg-slate-950/20">
            <button type="button" (click)="closeEditModal()" class="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-semibold rounded-xl text-xs transition-colors duration-150">Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors duration-150">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-down {
      animation: fadeInDown 0.2s ease-out forwards;
    }
    .ball-glow {
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))
              drop-shadow(0 0 24px rgba(255, 255, 255, 0.35))
              drop-shadow(0 0 48px rgba(200, 200, 255, 0.2));
    }
    .ball-glow-spain {
      filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.85))
              drop-shadow(0 0 28px rgba(234, 179, 8, 0.7))
              drop-shadow(0 0 50px rgba(239, 68, 68, 0.5)) !important;
    }
  `]
})
export class HeaderComponent {
  state = inject(StateService);

  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  isMuted = signal<boolean>(true);
  volume = 0.3;
  isDropdownOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);

  tempProfileNames: string[] = [];

  getSyncDotClass(): string {
    const status = this.state.apiSyncStatus();
    if (status.startsWith('Error') || status.startsWith('Token') || status.startsWith('API')) {
      return 'bg-red-500 animate-pulse';
    } else if (status.startsWith('Sincronizando')) {
      return 'bg-amber-500 animate-pulse';
    } else {
      return 'bg-emerald-500';
    }
  }

  toggleMusic() {
    const audio = this.audioPlayer.nativeElement;
    if (this.isMuted()) {
      audio.volume = this.volume;
      audio.play().then(() => {
        this.isMuted.set(false);
      }).catch(err => {
        console.warn('Playback blocked by browser auto-play policy', err);
      });
    } else {
      audio.pause();
      this.isMuted.set(true);
    }
  }

  updateVolume() {
    const audio = this.audioPlayer.nativeElement;
    audio.volume = this.volume;
    if (this.volume > 0 && this.isMuted()) {
      audio.play().then(() => {
        this.isMuted.set(false);
      }).catch(() => {});
    } else if (this.volume === 0 && !this.isMuted()) {
      audio.pause();
      this.isMuted.set(true);
    }
  }

  shareGroup() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace de la quiniela copiado al portapapeles. Compartelo con tus amigos.');
    }).catch(err => {
      console.error('Error al copiar el enlace:', err);
    });
  }

  toggleDropdown() {
    this.isDropdownOpen.update(v => !v);
  }

  exportData() {
    this.isDropdownOpen.set(false);
    const data = {
      realResults: this.state.realResults(),
      profiles: this.state.profiles()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predicciones_mundial2026_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event) {
    this.isDropdownOpen.set(false);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (imported.profiles || imported.realResults) {
            if (confirm('Esta accion sobrescribira los datos actuales en Firebase. ¿Deseas continuar?')) {
              if (imported.profiles) {
                this.state.importProfiles(imported.profiles);
              }
              if (imported.realResults) {
                this.state.importRealResults(imported.realResults);
              }
              alert('Datos importados correctamente.');
            }
          } else {
            alert('El archivo no tiene el formato correcto.');
          }
        } catch (err) {
          console.error(err);
          alert('Error al leer el archivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  }

  resetAll() {
    this.isDropdownOpen.set(false);
    if (confirm('¿Estas seguro de reiniciar TODAS las predicciones y resultados reales? Esta operacion no se puede deshacer.')) {
      this.state.resetAllData();
      alert('Aplicacion reiniciada.');
    }
  }

  getAvatar(index: number): string {
    return PROFILE_AVATARS[index] || 'assets/ibra.jpeg';
  }

  openEditModal() {
    this.tempProfileNames = this.state.profiles().map(p => p.name);
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  saveProfileNames() {
    this.state.updateProfileNames(this.tempProfileNames);
    this.isEditModalOpen.set(false);
    alert('Nombres guardados correctamente.');
  }

  toggleSpainSimulation() {
    const isActivating = !this.state.isSpainEventSimulated();
    this.state.isSpainEventSimulated.set(isActivating);
    if (isActivating) {
      this.playWhistleAlert();
    }
  }

  private playWhistleAlert() {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playPulse = (delay: number, duration: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2000, ctx.currentTime + delay);
        osc1.frequency.linearRampToValueAtTime(2040, ctx.currentTime + delay + 0.05);
        osc1.frequency.linearRampToValueAtTime(1960, ctx.currentTime + delay + duration - 0.05);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2150, ctx.currentTime + delay);
        osc2.frequency.linearRampToValueAtTime(2190, ctx.currentTime + delay + 0.05);
        osc2.frequency.linearRampToValueAtTime(2110, ctx.currentTime + delay + duration - 0.05);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.02);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + delay + duration - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.start(ctx.currentTime + delay);
        osc2.start(ctx.currentTime + delay);
        osc1.stop(ctx.currentTime + delay + duration);
        osc2.stop(ctx.currentTime + delay + duration);
      };
      
      playPulse(0, 0.15);
      playPulse(0.2, 0.45);
      
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      console.warn('Web Audio Whistle alert failed', e);
    }
  }
}
