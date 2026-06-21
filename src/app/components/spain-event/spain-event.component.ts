import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

@Component({
  selector: 'app-spain-event',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="state.isSpainEventActive()" 
         class="bg-gradient-to-br from-red-950/60 to-slate-900/60 border-2 border-red-500/40 rounded-2xl p-5 shadow-xl glass-card relative overflow-hidden animate-fade-in">
      
      <!-- Decoración de Fondo: Bandera de España difuminada -->
      <div class="absolute inset-0 z-0 opacity-10 pointer-events-none flex flex-col">
        <div class="bg-red-600 h-1/4 w-full"></div>
        <div class="bg-yellow-500 h-2/4 w-full"></div>
        <div class="bg-red-600 h-1/4 w-full"></div>
      </div>

      <div class="relative z-10 space-y-4">
        <!-- Cabecera Evento -->
        <div class="flex items-center justify-between border-b border-red-500/20 pb-3">
          <div class="flex items-center gap-2">
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <h3 class="text-sm font-extrabold text-red-200 tracking-wider uppercase flex items-center gap-1.5">
              <span>¡Juega La Roja!</span>
              <img src="https://flagcdn.com/w40/es.png" class="w-5 h-3.5 object-cover rounded-sm shadow-sm inline-block" alt="España">
            </h3>
          </div>
          <span class="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
            Evento en Vivo
          </span>
        </div>

        <!-- Info del Partido -->
        <div class="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 flex flex-col items-center justify-center text-center">
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Marcador en Tiempo Real</p>
          
          <div class="flex items-center justify-between w-full px-2 gap-4">
            <!-- España -->
            <div class="flex flex-col items-center justify-center flex-1">
              <img src="https://flagcdn.com/w80/es.png" class="w-12 h-9 object-cover border border-red-500/30 rounded-md shadow-md shadow-red-500/10 mb-1" alt="España">
              <span class="text-xs font-black text-slate-100 truncate w-full">España</span>
            </div>

            <!-- Score -->
            <div class="flex flex-col items-center justify-center gap-1">
              <div class="flex items-center gap-2 px-3 py-1 bg-red-950/60 border border-red-500/30 rounded-xl">
                <span class="text-xl font-black text-white">{{ getSpainScore('home') }}</span>
                <span class="text-xs font-bold text-red-400/80">:</span>
                <span class="text-xl font-black text-white">{{ getSpainScore('away') }}</span>
              </div>
              <span class="text-[9px] text-yellow-400 font-extrabold uppercase tracking-widest mt-0.5 animate-pulse">
                {{ getMatchStatusText() }}
              </span>
            </div>

            <!-- Rival -->
            <div class="flex flex-col items-center justify-center flex-1">
              <img [src]="getRivalFlagUrl()" class="w-12 h-9 object-cover border border-slate-800 rounded-md shadow-md mb-1" [alt]="getRivalName()">
              <span class="text-xs font-black text-slate-100 truncate w-full">{{ getRivalName() }}</span>
            </div>
          </div>
        </div>

        <!-- Botones Interactivos de Animación -->
        <div class="grid grid-cols-2 gap-2.5">
          <!-- Silbato de Árbitro -->
          <button (click)="triggerWhistle()" 
                  class="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/30 text-slate-350 hover:text-slate-100 rounded-xl transition-all duration-200 cursor-pointer shadow-inner group">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="text-red-450 group-hover:scale-110 transition-transform duration-200">
              <path d="M14.3 3c.4 0 .7.3.7.7v1.6c0 .4-.3.7-.7.7H13v3c0 1.1-.9 2-2 2H4.7c-.5 0-1-.2-1.4-.6L1 8.2V3.7c0-.4.3-.7.7-.7h12.6M14 4H2v3.8l2.1 1.7c.2.2.4.3.7.3H11c.6 0 1-.4 1-1V4h2Z"/>
              <path d="M6 9H2.5v1H6V9Zm0-3.5H2.5v1H6v-1ZM6.2 12H1.5a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H6c.1 0 .2 0 .2.1l2.5 3c.1.1.1.3 0 .4l-2.5 3a.2.2 0 0 1-.2.1Z"/>
            </svg>
            <span class="text-[10px] font-bold uppercase tracking-wider">Pitar Inicio</span>
          </button>

          <!-- Bocina de Estadio -->
          <button (click)="triggerHorn()" 
                  class="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-yellow-500/30 text-slate-350 hover:text-slate-100 rounded-xl transition-all duration-200 cursor-pointer shadow-inner group">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="text-yellow-500 group-hover:scale-110 transition-transform duration-200">
              <path d="M4 4a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3h1.5a.5.5 0 0 0 .45-.28l2.25-4.5a.5.5 0 0 0 0-.44L5.95 4.28A.5.5 0 0 0 5.5 4H4Zm6.63 1.12a.5.5 0 0 1 .71 0c2.15 2.15 2.15 5.61 0 7.76a.5.5 0 0 1-.71-.71c1.76-1.76 1.76-4.59 0-6.34a.5.5 0 0 1 0-.71Zm2.12-2.12a.5.5 0 0 1 .71 0c3.32 3.32 3.32 8.7 0 12.02a.5.5 0 0 1-.71-.71c2.93-2.93 2.93-7.68 0-10.6a.5.5 0 0 1 0-.71Z"/>
            </svg>
            <span class="text-[10px] font-bold uppercase tracking-wider">Sonar Bocina</span>
          </button>
        </div>

        <!-- Botón de Apoyo / ¡GOL! -->
        <button (click)="supportSpain()" 
                class="w-full py-3 bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-500 hover:to-yellow-400 text-white font-extrabold rounded-xl shadow-lg hover:shadow-red-600/25 active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm border-t border-white/20 select-none">
          <span>🔥</span>
          <span>¡APOYAR A LA SELECCIÓN!</span>
          <span class="bg-black/35 px-2 py-0.5 rounded-full text-[10px] font-mono shadow-inner font-extrabold text-yellow-300">
            +{{ userCheers() }}
          </span>
        </button>

      </div>
    </div>

    <!-- Canvas de Confeti a pantalla completa -->
    <canvas #confettiCanvas class="fixed inset-0 z-[100] pointer-events-none w-full h-full"></canvas>
  `,
  styles: [`
    .glass-card {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  `]
})
export class SpainEventComponent implements AfterViewInit, OnDestroy {
  state = inject(StateService);

  @ViewChild('confettiCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  userCheers = signal<number>(0);

  private ctx!: CanvasRenderingContext2D | null;
  private particles: ConfettiParticle[] = [];
  private animationId: number | null = null;

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private resizeCanvas = () => {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  // --- Información Dinámica del Partido ---
  private getActiveMatch() {
    return this.state.activeSpainMatch();
  }

  getSpainScore(side: 'home' | 'away'): string {
    const m = this.getActiveMatch();
    if (!m) return '0';
    
    // Si está simulado y no hay marcador real cargado
    if (this.state.isSpainEventSimulated() && (!m.score || m.score.fullTime?.home === null)) {
      return '1'; // Marcador de simulación simpático
    }

    const homeTLA = m.homeTeam?.tla?.toUpperCase();
    const score = m.score?.fullTime;
    
    if (score && score.home !== null && score.away !== null) {
      const isSpainHome = homeTLA === 'ESP';
      if (side === 'home') {
        return isSpainHome ? String(score.home) : String(score.away);
      } else {
        return isSpainHome ? String(score.away) : String(score.home);
      }
    }
    return '0';
  }

  getRivalName(): string {
    const m = this.getActiveMatch();
    if (!m) return 'Rival';
    const homeTLA = m.homeTeam?.tla?.toUpperCase();
    const awayTLA = m.awayTeam?.tla?.toUpperCase();
    
    const rivalTLA = homeTLA === 'ESP' ? awayTLA : homeTLA;
    if (!rivalTLA) return 'Rival';
    
    return this.state.getTeamInfo(rivalTLA).name || rivalTLA;
  }

  getRivalFlagUrl(): string {
    const m = this.getActiveMatch();
    if (!m) return 'https://placehold.co/40x30/333/666?text=?';
    
    const homeTLA = m.homeTeam?.tla?.toUpperCase();
    const awayTLA = m.awayTeam?.tla?.toUpperCase();
    const rivalTLA = homeTLA === 'ESP' ? awayTLA : homeTLA;
    
    if (!rivalTLA) return 'https://placehold.co/40x30/333/666?text=?';
    const flag = this.state.getTeamInfo(rivalTLA).flag;
    if (flag) {
      return `https://flagcdn.com/w40/${flag}.png`;
    }
    return 'https://placehold.co/40x30/333/666?text=?';
  }

  getMatchStatusText(): string {
    const m = this.getActiveMatch();
    if (!m) return '¡HOY!';
    
    if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
      return '¡EN JUEGO!';
    }
    if (m.status === 'FINISHED') {
      return 'FINALIZADO';
    }
    
    return '¡DIRECTO!';
  }

  // --- Efectos de Sonido Web Audio API ---
  triggerWhistle() {
    this.playWhistleSound();
    this.burstConfetti(25);
  }

  triggerHorn() {
    this.playHornSound();
    this.burstConfetti(25);
  }

  supportSpain() {
    this.userCheers.update(c => c + 1);
    this.playCheerSynth();
    this.burstConfetti(45);
  }

  private playWhistleSound() {
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
      
      // Referee whistle style: short whistle, then long whistle
      playPulse(0, 0.15);
      playPulse(0.2, 0.45);
      
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      console.warn('Web Audio Whistle failed', e);
    }
  }

  private playHornSound() {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(233, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(235, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(230, ctx.currentTime + 0.8);
      osc.frequency.linearRampToValueAtTime(233, ctx.currentTime + 1.2);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(1.8, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 1.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
      
      setTimeout(() => ctx.close(), 1500);
    } catch (e) {
      console.warn('Web Audio Horn failed', e);
    }
  }

  private playCheerSynth() {
    // Generate a quick positive chime arpeggio (C-E-G-C) using Web Audio API to represent stadium cheer chords
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + idx * 0.08 + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
      
      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      console.warn('Web Audio Cheer failed', e);
    }
  }

  // --- Confeti Virtual Animado ---
  private burstConfetti(amount: number) {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    
    const colors = ['#dc2626', '#fbbf24', '#ffffff', '#b91c1c', '#f59e0b']; // España Rojo & Gualda + blanco
    
    for (let i = 0; i < amount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10, // Start slightly below screen
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 10 - 5,
        speedY: -(Math.random() * 15 + 10), // Burst upwards
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: Math.random() * 0.2 - 0.1,
        opacity: 1
      });
    }

    if (!this.animationId) {
      this.animateConfetti();
    }
  }

  private animateConfetti = () => {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.35; // Gravity
      p.rotation += p.rotationSpeed;
      
      // Fade out slowly when falling
      if (p.speedY > 0) {
        p.opacity -= 0.015;
      }

      if (p.opacity <= 0 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      // Draw rectangular confetti piece
      this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(this.animateConfetti);
    } else {
      this.animationId = null;
    }
  };
}
