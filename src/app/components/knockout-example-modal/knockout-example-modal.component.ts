import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RuleType = 'empate-exacto' | 'resultado-exacto' | 'empate-pasar' | 'acierto-minimo';

@Component({
  selector: 'app-knockout-example-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[85vh]">
        <!-- Cabecera -->
        <div class="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div class="flex items-center gap-2">
            <span class="text-xl">📖</span>
            <h2 class="text-xs font-black text-white uppercase tracking-wider">{{ getTitle() }}</h2>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white text-base font-bold transition-colors duration-150 cursor-pointer">X</button>
        </div>

        <!-- Cuerpo -->
        <div class="p-5 overflow-y-auto text-xs md:text-sm">
          <ng-container [ngSwitch]="ruleType">
            
            <!-- CASO: EMPATE EXACTO (+4 pts) -->
            <div *ngSwitchCase="'empate-exacto'" class="space-y-4">
              <div class="bg-slate-950/65 p-4 rounded-2xl border border-slate-800/80 space-y-3 font-medium">
                <div class="flex justify-between items-center gap-2">
                  <span class="text-slate-400">Tu Pronóstico:</span>
                  <span class="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    España <span class="text-emerald-400 font-bold">1-1</span> Austria (Pasa España)
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-slate-400">Resultado Real:</span>
                  <span class="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    España <span class="text-emerald-400 font-bold">1-1</span> Austria (Pasa España en Penaltis)
                  </span>
                </div>
              </div>
              <div class="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl text-center text-[11px] text-emerald-400 font-bold">
                Puntuación: +4 puntos (Acierto de goles exactos + pasar)
              </div>
            </div>

            <!-- CASO: RESULTADO EXACTO (+3 pts) -->
            <div *ngSwitchCase="'resultado-exacto'" class="space-y-4">
              <div class="bg-slate-950/65 p-4 rounded-2xl border border-slate-800/80 space-y-3 font-medium">
                <div class="flex justify-between items-center gap-2">
                  <span class="text-slate-400">Tu Pronóstico:</span>
                  <span class="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    España <span class="text-emerald-400 font-bold">2-1</span> Austria
                  </span>
                </div>
                <div class="flex justify-between items-center gap-2">
                  <span class="text-slate-400">Resultado Real:</span>
                  <span class="text-white font-bold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    España <span class="text-emerald-400 font-bold">2-1</span> Austria
                  </span>
                </div>
              </div>
              <div class="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl text-center text-[11px] text-emerald-400 font-bold">
                Puntuación: +3 puntos (Acierto de goles exactos en no-empate)
              </div>
            </div>

            <!-- CASO: EMPATE / PASAR (+2 pts) -->
            <div *ngSwitchCase="'empate-pasar'" class="space-y-3">
              <!-- Escenario A -->
              <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 space-y-1 font-medium">
                <p class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Caso 1: Acertar goles, fallar al pasar</p>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  • Pronóstico: <span class="text-white">1-1 (Pasa España)</span><br>
                  • Realidad: <span class="text-white">1-1 (Pasa Austria por Penaltis)</span><br>
                  <span class="text-blue-300 font-bold block mt-1">→ Puntos: +2 pts</span>
                </p>
              </div>

              <!-- Escenario B -->
              <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 space-y-1 font-medium">
                <p class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Caso 2: Fallar goles, acertar al pasar en empate</p>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  • Pronóstico: <span class="text-white">1-1 (Pasa España)</span><br>
                  • Realidad: <span class="text-white">2-2 (Pasa España por Penaltis)</span><br>
                  <span class="text-blue-300 font-bold block mt-1">→ Puntos: +2 pts</span>
                </p>
              </div>
            </div>

            <!-- CASO: ACIERTO MÍNIMO (+1 pt) -->
            <div *ngSwitchCase="'acierto-minimo'" class="space-y-3">
              <!-- Escenario A -->
              <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 space-y-1 font-medium">
                <p class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Caso 1: Empate fallido fallando al pasar</p>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  • Pronóstico: <span class="text-white">1-1 (Pasa España)</span><br>
                  • Realidad: <span class="text-white">2-2 (Pasa Austria por Penaltis)</span><br>
                  <span class="text-amber-300 font-bold block mt-1">→ Puntos: +1 pt (Solo acertaste que empataban)</span>
                </p>
              </div>

              <!-- Escenario B -->
              <div class="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850 space-y-1 font-medium">
                <p class="font-bold text-amber-400 text-[10px] uppercase tracking-wider">Caso 2: Solo acertar quién pasa de ronda</p>
                <p class="text-slate-300 text-[11px] leading-relaxed">
                  • Pronóstico: <span class="text-white">1-1 al pasar España</span> (o 2-1 ganando España)<br>
                  • Realidad: <span class="text-white">2-1 ganando España</span> (no hubo empate)<br>
                  <span class="text-amber-300 font-bold block mt-1">→ Puntos: +1 pt (Solo acertaste que pasaba España)</span>
                </p>
              </div>
            </div>

          </ng-container>
        </div>

        <!-- Botón de Cerrar -->
        <div class="p-4 border-t border-slate-800/80 bg-slate-950/30 text-right">
          <button (click)="close.emit()" class="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer active:scale-95 transition-all duration-150 outline-none">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `
})
export class KnockoutExampleModalComponent {
  @Input() ruleType: RuleType = 'empate-exacto';
  @Output() close = new EventEmitter<void>();

  getTitle(): string {
    switch (this.ruleType) {
      case 'empate-exacto': return 'Empate Exacto (+4 pts)';
      case 'resultado-exacto': return 'Resultado Exacto (+3 pts)';
      case 'empate-pasar': return 'Empate / Pasar (+2 pts)';
      case 'acierto-minimo': return 'Acierto Mínimo (+1 pt)';
      default: return 'Ejemplo de Puntuación';
    }
  }
}
