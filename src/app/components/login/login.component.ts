import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { PROFILE_AVATARS } from '../../constants/constants';
import { ProfileCarouselComponent } from '../profile-carousel/profile-carousel.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileCarouselComponent],
  template: `
    <div class="min-h-screen w-full flex items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden select-none bg-slate-950 max-w-full">
      
      <!-- Ambient light effect in background -->
      <div class="fixed w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px] -top-40 -left-40 pointer-events-none"></div>
      <div class="fixed w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[100px] -bottom-40 -right-40 pointer-events-none"></div>

      <!-- Main Login Card Container -->
      <div class="w-full max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 md:p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center my-auto">
        
        <!-- Header / Logo -->
        <div class="flex flex-col items-center mb-4 md:mb-6 text-center">
          <div class="w-16 h-16 md:w-20 md:h-20 mb-2 md:mb-3 relative flex items-center justify-center">
            <img src="assets/ball.png" class="w-14 h-14 md:w-18 md:h-18 object-contain animate-spin-slow ball-glow" alt="Balón 2026">
          </div>
          <h2 class="text-xl md:text-2xl font-extrabold tracking-wide text-white leading-none">
            Mundial <span style="color: #FFD700;">2026</span>
          </h2>
          <p class="text-[10px] md:text-xs text-slate-400 mt-1 md:mt-2 font-medium">Quiniela Chavules</p>
        </div>

        <!-- 3D Profile Carousel Selection -->
        <div class="w-full mb-4 md:mb-6">
          <label class="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">
            Selecciona tu Perfil
          </label>
          <app-profile-carousel (profileSelected)="selectProfile($event)"></app-profile-carousel>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="w-full space-y-3 md:space-y-4">
          
          <!-- Password Input (Standard Login) -->
          <div class="space-y-1 md:space-y-1.5" *ngIf="selectedId() !== null && hasPassword()">
            <label class="block text-[10px] md:text-xs font-semibold text-slate-400" for="password">Contraseña</label>
            <input type="password" id="password" [(ngModel)]="password" name="password" required placeholder="••••••••"
                   class="w-full px-4 py-2.5 md:py-3 bg-slate-950 border border-slate-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-xl text-white outline-none transition-all duration-150 text-sm">
          </div>

          <!-- Password Registration (First Access Setup) -->
          <div class="space-y-2.5 md:space-y-3" *ngIf="selectedId() !== null && !hasPassword()">
            <div class="p-2.5 md:p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] md:text-xs rounded-xl font-medium leading-relaxed">
            Este perfil aún no tiene contraseña.
            </div>
            
            <div class="space-y-1 md:space-y-1.5">
              <label class="block text-[10px] md:text-xs font-semibold text-slate-400" for="reg-password">Nueva Contraseña</label>
              <input type="password" id="reg-password" [(ngModel)]="password" name="reg-password" required placeholder="••••••••"
                     class="w-full px-4 py-2.5 md:py-3 bg-slate-950 border border-slate-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-xl text-white outline-none transition-all duration-150 text-sm">
            </div>

            <div class="space-y-1 md:space-y-1.5">
              <label class="block text-[10px] md:text-xs font-semibold text-slate-400" for="confirm-password">Confirmar Contraseña</label>
              <input type="password" id="confirm-password" [(ngModel)]="confirmPassword" name="confirm-password" required placeholder="••••••••"
                     class="w-full px-4 py-2.5 md:py-3 bg-slate-950 border border-slate-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-xl text-white outline-none transition-all duration-150 text-sm">
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between" *ngIf="selectedId() !== null">
            <label class="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-slate-400 cursor-pointer">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe"
                     class="w-3.5 h-3.5 md:w-4 md:h-4 rounded-md bg-slate-950 border-slate-850 text-purple-500 focus:ring-0 cursor-pointer">
              Iniciar automáticamente
            </label>
          </div>

          <!-- Error Feedback -->
          <div *ngIf="errorMessage()" class="p-2.5 md:p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center animate-shake">
            {{ errorMessage() }}
          </div>

          <!-- Submit Button -->
          <button type="submit" [disabled]="selectedId() === null || !password || (!hasPassword() && !confirmPassword)"
                  class="w-full py-3 md:py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-500/15 hover:shadow-purple-500/30 transition-all duration-200 cursor-pointer outline-none">
            {{ hasPassword() ? 'Acceder' : 'Crear y Acceder' }}
          </button>
        </form>

      </div>
    </div>
  `,
  styles: [`
    .ball-glow {
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.7))
              drop-shadow(0 0 24px rgba(255, 255, 255, 0.35))
              drop-shadow(0 0 48px rgba(200, 200, 255, 0.2));
    }
    .animate-spin-slow {
      animation: spin 8s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .profile-card {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .profile-card:hover {
      background: rgba(30, 35, 65, 0.45);
      border-color: rgba(255, 255, 255, 0.12);
    }
    .active-card {
      background: linear-gradient(150deg, rgba(93, 0, 235, 0.45) 0%, rgba(60, 0, 160, 0.2) 100%);
      border-color: rgba(147, 51, 234, 0.6);
      box-shadow: 0 0 15px rgba(93, 0, 235, 0.25);
    }
    .active-card-red {
      background: linear-gradient(150deg, rgba(216, 27, 96, 0.35) 0%, rgba(150, 10, 60, 0.15) 100%);
      border-color: rgba(239, 68, 68, 0.5);
      box-shadow: 0 0 15px rgba(216, 27, 96, 0.2);
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.30s ease-in-out;
    }
  `]
})
export class LoginComponent {
  state = inject(StateService);

  selectedId = signal<number | 'admin' | null>(null);
  password = '';
  confirmPassword = '';
  rememberMe = true;
  errorMessage = signal<string | null>(null);

  hasPassword = computed(() => {
    const id = this.selectedId();
    if (id === 'admin') return true;
    if (id === null) return false;
    const profile = this.state.profiles().find(p => p.id === id);
    return !!(profile && profile.password);
  });

  getAvatar(id: number): string {
    return PROFILE_AVATARS[id] || 'assets/ibra.jpeg';
  }

  selectProfile(id: number | 'admin') {
    this.selectedId.set(id);
    this.password = '';
    this.confirmPassword = '';
    this.errorMessage.set(null);
  }

  async onSubmit() {
    const id = this.selectedId();
    if (id === null || !this.password) return;

    this.errorMessage.set(null);

    if (!this.hasPassword()) {
      if (id === 'admin') return;
      if (this.password !== this.confirmPassword) {
        this.errorMessage.set('Las contraseñas no coinciden.');
        return;
      }
      if (this.password.length < 4) {
        this.errorMessage.set('La contraseña debe tener al menos 4 caracteres.');
        return;
      }
      const success = await this.state.registerPassword(id, this.password);
      if (!success) {
        this.errorMessage.set('Error al guardar la contraseña en Firebase.');
      }
    } else {
      const success = this.state.login(id, this.password, this.rememberMe);
      if (!success) {
        this.errorMessage.set('Contraseña incorrecta. Por favor, vuelve a intentarlo.');
      }
    }
  }
}
