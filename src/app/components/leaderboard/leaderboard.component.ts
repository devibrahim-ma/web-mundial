import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';
import { PROFILE_AVATARS, FRIEND_THEMES } from '../../constants/constants';
import { LeaderboardItem } from '../../models/types';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/30 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 shadow-xl transition-all duration-300">
      <div class="flex flex-col gap-3 border-b border-slate-800 pb-4 mb-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-white tracking-wide">Clasificación</h2>
        </div>
        <!-- Pestañas de Clasificación -->
        <div class="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button (click)="state.leaderboardTab.set('general')"
                  class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                  [ngClass]="state.leaderboardTab() === 'general' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'">
            General
          </button>
          <button (click)="state.leaderboardTab.set('groups')"
                  class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                  [ngClass]="state.leaderboardTab() === 'groups' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'">
            Grupos
          </button>
          <button (click)="state.leaderboardTab.set('knockouts')"
                  class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer"
                  [ngClass]="state.leaderboardTab() === 'knockouts' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'">
            Fase Final
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">
              <th class="py-2.5 w-12 text-center">Pos</th>
              <th class="py-2.5">Amigo</th>
              <th class="py-2.5 text-center w-20">E/A/F</th>
              <th class="py-2.5 text-right w-16">Pts</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/40">
            <tr *ngFor="let item of state.activeLeaderboard(); let idx = index" 
                (click)="selectProfile(item.id)"
                class="hover:bg-slate-800/40 transition-colors duration-150 cursor-pointer group rounded-lg"
                [ngClass]="{
                  'bg-purple-500/10 hover:bg-purple-500/20': state.activeProfileId() === item.id,
                  'border-l-2 border-purple-500': state.myProfileId() === item.id
                }">
              <!-- Position Rank -->
              <td class="py-3 text-center text-sm font-bold">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold"
                      [ngClass]="{
                        'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10': idx === 0,
                        'bg-slate-300 text-slate-900 shadow-md shadow-slate-350/10': idx === 1,
                        'bg-amber-700 text-slate-100 shadow-md shadow-amber-700/10': idx === 2,
                        'text-slate-400': idx > 2
                      }">
                  {{ idx + 1 }}
                </span>
              </td>

              <!-- Profile avatar and name + flags below -->
              <td class="py-3 pr-2">
                <div class="flex items-center gap-2.5">
                  <div class="relative flex-shrink-0">
                    <img [src]="getAvatar(item.id)" class="w-7 h-7 rounded-full border border-slate-700/60 object-cover shadow-sm" alt="Avatar" loading="lazy">
                    <span *ngIf="state.myProfileId() === item.id" class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                    </span>
                  </div>
                  
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold group-hover:text-purple-400 truncate transition-colors duration-150"
                          [ngClass]="state.activeProfileId() === item.id ? 'text-purple-400' : 'text-slate-200'">
                      {{ item.name }}
                    </span>
                    <span *ngIf="getThemeFlags(item.id).length > 0" class="flex items-center gap-0.5 mt-0.5">
                      <img *ngFor="let flag of getThemeFlags(item.id)" 
                           loading="lazy"
                           [src]="'https://flagcdn.com/w20/' + flag + '.png'" 
                           class="w-3 h-2 object-cover rounded-[1px] border border-slate-950/40" 
                           alt="">
                    </span>
                  </div>
                </div>
              </td>

              <!-- E/A/F Stats -->
              <td class="py-3 text-center text-xs font-semibold text-slate-400">
                <div class="flex items-center justify-center gap-1 font-mono">
                  <span class="text-emerald-400" title="Exacto">{{ item.perfect }}</span>
                  <span class="text-slate-500">/</span>
                  <span class="text-amber-400" title="Acierto">{{ item.outcome }}</span>
                  <span class="text-slate-500">/</span>
                  <span class="text-red-400" title="Fallo">{{ item.fail }}</span>
                </div>
              </td>

              <!-- Points -->
              <td class="py-3 text-right text-sm font-extrabold pr-1"
                  [ngClass]="state.activeProfileId() === item.id ? 'text-purple-400' : 'text-white'">
                {{ item.points }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4 mt-4 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> E: Exacto (3 pts)</span>
        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> A: Acierto (1 pt)</span>
        <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span> F: Fallo (0 pts)</span>
      </div>
    </div>
  `
})
export class LeaderboardComponent {
  state = inject(StateService);

  getAvatar(id: number | string): string {
    return PROFILE_AVATARS[Number(id)] || 'assets/ibra.jpeg';
  }

  getThemeFlags(profileId: number | string): string[] {
    const theme = FRIEND_THEMES[Number(profileId)];
    return theme ? theme.flags : [];
  }

  selectProfile(id: number | string) {
    if (typeof id === 'number') {
      this.state.activeProfileId.set(id);
    }
  }
}
