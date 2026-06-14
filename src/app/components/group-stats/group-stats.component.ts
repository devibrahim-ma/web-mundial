import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-group-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/30 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 shadow-xl transition-all duration-300">
      <div class="border-b border-slate-800 pb-3 mb-4">
        <h2 class="text-base font-bold text-white tracking-wide">Estadísticas del Grupo</h2>
      </div>
      
      <div class="space-y-4">
        <!-- Rey del Pleno -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rey del Pleno (+3 pts):</span>
          <span class="text-sm font-extrabold text-emerald-400">{{ perfectLeadersText() }}</span>
        </div>

        

        <!-- Más Aciertos -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Más Aciertos (+1 pt):</span>
          <span class="text-sm font-extrabold text-amber-400">{{ outcomeLeadersText() }}</span>
        </div>

       

        <!-- Goles Pronosticados -->
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Goles Pronosticados:</span>
          <span class="text-sm font-extrabold text-slate-100">{{ totalGoals() }} goles</span>
        </div>
      </div>
    </div>
  `
})
export class GroupStatsComponent {
  state = inject(StateService);

  // Computed totals for goals
  readonly totalGoals = computed(() => {
    let total = 0;
    this.state.profiles().forEach(p => {
      if (p.predictions) {
        Object.values(p.predictions).forEach(pred => {
          if (pred && pred.score1 !== null && pred.score1 !== undefined) {
            total += Number(pred.score1);
          }
          if (pred && pred.score2 !== null && pred.score2 !== undefined) {
            total += Number(pred.score2);
          }
        });
      }
    });
    return total;
  });

  // Helper to format names of multiple leaders
  private formatLeaders(names: string[]): string {
    if (names.length === 0) return 'Ninguno';
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
  }

  // Computed leaders for exact scores
  readonly perfectLeadersText = computed(() => {
    const scores = this.state.leaderboard();
    if (scores.length === 0) return 'Ninguno';

    let maxPerfect = -1;
    let leaders: string[] = [];

    scores.forEach(row => {
      if (row.perfect > maxPerfect) {
        maxPerfect = row.perfect;
        leaders = [row.name];
      } else if (row.perfect === maxPerfect && maxPerfect > 0) {
        leaders.push(row.name);
      }
    });

    return maxPerfect > 0 ? `${this.formatLeaders(leaders)} (${maxPerfect})` : 'Ninguno';
  });

  // Computed leaders for outcome predictions
  readonly outcomeLeadersText = computed(() => {
    const scores = this.state.leaderboard();
    if (scores.length === 0) return 'Ninguno';

    let maxOutcome = -1;
    let leaders: string[] = [];

    scores.forEach(row => {
      if (row.outcome > maxOutcome) {
        maxOutcome = row.outcome;
        leaders = [row.name];
      } else if (row.outcome === maxOutcome && maxOutcome > 0) {
        leaders.push(row.name);
      }
    });

    return maxOutcome > 0 ? `${this.formatLeaders(leaders)} (${maxOutcome})` : 'Ninguno';
  });
}
