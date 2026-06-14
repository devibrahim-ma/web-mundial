import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';
import { PROFILE_AVATARS, FRIEND_THEMES } from '../../constants/constants';

@Component({
  selector: 'app-profiles-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Outer glass container — rounded card like the reference -->
    <nav class="w-full py-3">
      <div class="nav-outer-card max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="nav-inner flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">

          <!-- Friend Profiles Tabs -->
          <button *ngFor="let prof of state.profiles(); let idx = index"
                  (click)="selectProfile(prof.id)"
                  class="profile-tab flex flex-col items-center justify-center gap-2.5 py-3 px-5 rounded-2xl border transition-all duration-250 flex-1 min-w-[110px] cursor-pointer outline-none"
                  [ngClass]="state.activeProfileId() === prof.id
                    ? 'tab-active text-white'
                    : 'tab-default text-slate-400 hover:text-white'">

            <!-- Name + flags -->
            <span class="text-xs font-extrabold tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap">
              {{ prof.name }}
              <span *ngIf="getThemeFlags(prof.id).length > 0" class="flex items-center gap-0.5">
                <img *ngFor="let flag of getThemeFlags(prof.id)"
                     loading="lazy"
                     [src]="'https://flagcdn.com/w20/' + flag + '.png'"
                     class="w-3 h-2 object-cover rounded-[1px] shadow-sm border border-slate-800/40"
                     alt="">
              </span>
            </span>

            <!-- Avatar -->
            <div class="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 transition-all duration-300"
                 [ngClass]="state.activeProfileId() === prof.id
                   ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105'
                   : ''">
              <img [src]="getAvatar(prof.id)" class="w-full h-full object-cover" [alt]="prof.name" loading="lazy">
            </div>
          </button>

          <!-- Calendario Tab -->
          <button (click)="selectProfile('calendar')"
                  class="profile-tab flex flex-col items-center justify-center gap-2.5 py-3 px-5 rounded-2xl border transition-all duration-250 flex-1 min-w-[110px] cursor-pointer outline-none"
                  [ngClass]="state.activeProfileId() === 'calendar'
                    ? 'tab-active text-white'
                    : 'tab-default text-slate-400 hover:text-white'">
            <span class="text-xs font-extrabold tracking-wide">Calendario</span>
            <div class="w-14 h-14 rounded-full overflow-hidden bg-slate-950 flex-shrink-0 transition-all duration-300"
                 [ngClass]="state.activeProfileId() === 'calendar'
                   ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105'
                   : ''">
              <img src="assets/icono.png" class="w-full h-full object-cover" alt="Calendario">
            </div>
          </button>

          <!-- Admin Tab -->
          <button *ngIf="state.userRole() === 'admin'"
                  (click)="selectProfile('real')"
                  class="profile-tab flex flex-col items-center justify-center gap-2.5 py-3 px-5 rounded-2xl border transition-all duration-250 flex-1 min-w-[110px] cursor-pointer outline-none"
                  [ngClass]="state.activeProfileId() === 'real'
                    ? 'tab-active-red text-white'
                    : 'tab-default text-red-400 hover:text-red-200'">
            <span class="text-xs font-extrabold tracking-wide flex flex-col items-center gap-0.5">
              Resultados Reales
              <span class="text-[9px] font-semibold text-red-500 uppercase tracking-widest leading-none">Admin</span>
            </span>
            <div class="w-14 h-14 rounded-full overflow-hidden bg-slate-950 flex-shrink-0 transition-all duration-300"
                 [ngClass]="state.activeProfileId() === 'real'
                   ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900 scale-105'
                   : ''">
              <img src="assets/icono.png" class="w-full h-full object-cover" alt="Admin">
            </div>
          </button>

        </div>
      </div>
    </nav>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    /* Outer glass card — matches other cards on the page */
    .nav-outer-card {
      background: rgba(13, 15, 30, 0.72);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 24px;
      padding: 8px;
    }

    /* Inner flex row */
    .nav-inner {
      padding: 0;
    }

    /* Base tab — fully invisible by default */
    .profile-tab {
      background: transparent;
      border-color: transparent;
      transition: background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
    }

    /* Hover: card appears with border */
    .tab-default:hover {
      background: rgba(30, 35, 65, 0.65);
      border-color: rgba(255, 255, 255, 0.14);
    }
    .tab-default {
      background: transparent;
      border-color: transparent;
    }

    /* Active purple — matches reference exactly */
    .tab-active {
      background: linear-gradient(150deg, rgba(93, 0, 235, 0.55) 0%, rgba(60, 0, 160, 0.28) 100%);
      border-color: rgba(147, 51, 234, 0.65);
      box-shadow: 0 0 0 1px rgba(147, 51, 234, 0.3), 0 4px 24px rgba(93, 0, 235, 0.35);
    }

    /* Active red (admin) */
    .tab-active-red {
      background: linear-gradient(150deg, rgba(216, 27, 96, 0.45) 0%, rgba(150, 10, 60, 0.22) 100%);
      border-color: rgba(239, 68, 68, 0.6);
      box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3), 0 4px 20px rgba(216, 27, 96, 0.3);
    }
  `]
})
export class ProfilesNavbarComponent {
  state = inject(StateService);

  getAvatar(id: number): string {
    return PROFILE_AVATARS[id] || 'assets/ibra.jpeg';
  }

  getThemeFlags(profileId: number): string[] {
    const theme = FRIEND_THEMES[profileId];
    return theme ? theme.flags : [];
  }

  selectProfile(id: number | 'real' | 'calendar') {
    this.state.activeProfileId.set(id);
  }
}
