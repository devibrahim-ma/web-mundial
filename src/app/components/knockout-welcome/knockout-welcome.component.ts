import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnockoutExampleModalComponent, RuleType } from '../knockout-example-modal/knockout-example-modal.component';

@Component({
  selector: 'app-knockout-welcome',
  standalone: true,
  imports: [CommonModule, KnockoutExampleModalComponent],
  template: `
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-blue-950/40 border border-slate-900 p-6 md:p-8 shadow-2xl flex flex-col items-center text-center gap-6 w-full">
      <!-- Overlay decorativo de luces traseras -->
      <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -left-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <!-- Icono y Título Centrado arriba -->
      <div class="flex flex-col items-center gap-3 z-10">
        <img src="assets/ball.png" class="w-12 h-12 object-contain animate-bounce" alt="Pelota">
        <h1 class="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 uppercase tracking-wider">
          ¡Bienvenidos a la Fase Eliminatoria!
        </h1>
      </div>

      <!-- Explicación de empates en el centro -->
      <div class="z-10 max-w-2xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 md:p-5 shadow-inner relative w-full">
        <p class="text-xs md:text-sm font-bold text-amber-300 uppercase tracking-wider mb-2">¿Cómo pronosticar en caso de empate?</p>
        <p class="text-xs md:text-sm text-slate-200 leading-relaxed">
          En los partidos eliminatorios no puede haber empate al final de la eliminatoria. Si colocas un marcador de empate (ej: <span class="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">1-1</span>), los nombres de ambos equipos se volverán interactivos. <span class="text-amber-400 font-bold underline">Haz clic sobre el equipo</span> que creas que avanzará.
        </p>
      </div>

      <!-- Sistema de puntuación abajo -->
      <div class="w-full z-10 space-y-4 flex flex-col items-center">
        <h2 class="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-2 max-w-xs w-full text-center">
          Sistema de Puntuación
        </h2>
        
        <div class="flex flex-col gap-3 w-full max-w-xl">
          <!-- Empate exacto -->
          <div class="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-850 hover:border-emerald-500/30 transition-all duration-200">
            <span class="flex-shrink-0 flex items-center justify-center w-14 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 font-black border border-emerald-500/20 text-sm shadow-sm">+4 pts</span>
            <div class="text-left flex-grow">
              <p class="font-extrabold text-sm text-white mb-0.5">Empate Exacto</p>
              <p class="text-xs text-slate-400 leading-normal font-medium font-sans">Marcador exacto de empate Y acierto de quién pasa de ronda.</p>
            </div>
            <button (click)="activeRuleExample = 'empate-exacto'" class="flex-shrink-0 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer outline-none">
              Ejemplo
            </button>
          </div>
          
          <!-- Resultado exacto -->
          <div class="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-850 hover:border-emerald-500/30 transition-all duration-200">
            <span class="flex-shrink-0 flex items-center justify-center w-14 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 font-black border border-emerald-500/20 text-sm shadow-sm">+3 pts</span>
            <div class="text-left flex-grow">
              <p class="font-extrabold text-sm text-white mb-0.5">Resultado Exacto</p>
              <p class="text-xs text-slate-400 leading-normal font-medium font-sans">Marcador exacto de partido finalizado sin empate (ej: 2-1).</p>
            </div>
            <button (click)="activeRuleExample = 'resultado-exacto'" class="flex-shrink-0 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer outline-none">
              Ejemplo
            </button>
          </div>
          
          <!-- Empate / Pasar -->
          <div class="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-850 hover:border-blue-500/30 transition-all duration-200">
            <span class="flex-shrink-0 flex items-center justify-center w-14 h-10 rounded-xl bg-blue-500/15 text-blue-400 font-black border border-blue-500/20 text-sm shadow-sm">+2 pts</span>
            <div class="text-left flex-grow">
              <p class="font-extrabold text-sm text-white mb-0.5">Empate / Pasar</p>
              <p class="text-xs text-slate-400 leading-normal font-medium font-sans">Empate exacto fallando al pasar, o acierto al pasar en empate fallido.</p>
            </div>
            <button (click)="activeRuleExample = 'empate-pasar'" class="flex-shrink-0 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer outline-none">
              Ejemplo
            </button>
          </div>
          
          <!-- Acierto mínimo -->
          <div class="flex items-center gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-850 hover:border-amber-500/30 transition-all duration-200">
            <span class="flex-shrink-0 flex items-center justify-center w-14 h-10 rounded-xl bg-amber-500/15 text-amber-400 font-black border border-amber-500/20 text-sm">+1 pt</span>
            <div class="text-left flex-grow">
              <p class="font-extrabold text-sm text-white mb-0.5">Acierto Mínimo</p>
              <p class="text-xs text-slate-400 leading-normal font-medium font-sans">Empate fallido fallando al pasar, o ganador normal del partido.</p>
            </div>
            <button (click)="activeRuleExample = 'acierto-minimo'" class="flex-shrink-0 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] px-3.5 py-2 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer outline-none">
              Ejemplo
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Dinámico de Ejemplo de Pronóstico -->
    <app-knockout-example-modal 
      *ngIf="activeRuleExample" 
      [ruleType]="activeRuleExample" 
      (close)="activeRuleExample = null">
    </app-knockout-example-modal>
  `
})
export class KnockoutWelcomeComponent {
  activeRuleExample: RuleType | null = null;
}
