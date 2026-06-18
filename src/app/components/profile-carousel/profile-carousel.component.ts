import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';
import { PROFILE_AVATARS } from '../../constants/constants';
import { Capacitor } from '@capacitor/core';

interface CarouselItem {
  id: number | 'admin';
  name: string;
  avatar: string;
  isAdmin: boolean;
  rating: number;
  position: string;
  flag: string;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

@Component({
  selector: 'app-profile-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- SVG ClipPath Definition for the exact FIFA Shield -->
    <svg width="0" height="0" class="absolute">
      <defs>
        <clipPath id="fifa-shield" clipPathUnits="objectBoundingBox">
          <path d="M 0.5,0.044 C 0.45,0.084 0.28,0.084 0.15,0.044 C 0.10,0.024 0.02,0.074 0.02,0.143 L 0.02,0.786 C 0.02,0.866 0.20,0.936 0.5,0.986 C 0.80,0.936 0.98,0.866 0.98,0.786 L 0.98,0.143 C 0.98,0.074 0.90,0.024 0.85,0.044 C 0.72,0.084 0.55,0.084 0.5,0.044 Z" />
        </clipPath>
      </defs>
    </svg>

    <div class="carousel-container relative w-full h-80 flex items-center justify-center overflow-visible select-none mt-4"
         (touchstart)="onTouchStart($event)" 
         (touchend)="onTouchEnd($event)">
      
      <!-- Arrow Left -->
      <button type="button" (click)="rotateLeft()" 
              [ngClass]="isWeb ? 'flex' : 'hidden md:flex'"
              class="absolute left-4 z-30 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      </button>

      <!-- Carousel Stage -->
      <div class="carousel-stage relative w-80 h-72 flex items-center justify-center overflow-visible">
        <div *ngFor="let item of items; let idx = index"
             (click)="selectItem(idx)"
             [ngStyle]="getItemStyle(idx)"
             class="carousel-item absolute w-48 h-72 flex flex-col p-0 transition-all duration-500 cursor-pointer shadow-2xl overflow-visible fifa-card-shape bg-slate-950">
          
          <!-- Double border overlay using precise SVG matching clip-path shape -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 140" preserveAspectRatio="none">
            <!-- Outer border -->
            <path d="M 50,6.2 C 45,11.8 28,11.8 15,6.2 C 10,3.4 2,10.4 2,20 L 2,110 C 2,121.2 20,131 50,138 C 80,131 98,121.2 98,110 L 98,20 C 98,10.4 90,3.4 85,6.2 C 72,11.8 55,11.8 50,6.2 Z" 
                  fill="none" 
                  [attr.stroke]="activeIndex() === idx ? (item.isAdmin ? '#ef4444' : '#fbbf24') : 'rgba(255,255,255,0.25)'" 
                  stroke-width="2" />
            <!-- Inner border -->
            <path d="M 50,8.2 C 45,13.8 28,13.8 15,8.2 C 12,5.4 4,12.4 4,22 L 4,108 C 4,119.2 20,129 50,136 C 80,129 96,119.2 96,108 L 96,22 C 96,12.4 88,5.4 85,8.2 C 72,13.8 55,13.8 50,8.2 Z" 
                  fill="none" 
                  [attr.stroke]="activeIndex() === idx ? (item.isAdmin ? '#991b1b' : '#d97706') : 'rgba(255,255,255,0.12)'" 
                  stroke-width="0.8" />
          </svg>

          <!-- Top Left Section (Rating + Position + Flag) -->
          <div class="absolute left-4 top-7 flex flex-col items-center space-y-1.5 z-10">
            <span class="text-3xl font-black tracking-tighter leading-none text-white font-sans drop-shadow-md">
              {{ item.rating }}
            </span>
            <span class="text-[10px] font-black uppercase tracking-widest text-white/95 leading-none">
              {{ item.position }}
            </span>
            <!-- Country Flag -->
            <div class="pt-1.5">
              <img [src]="'https://flagcdn.com/w40/' + item.flag + '.png'" class="w-8 h-5 object-cover shadow border border-black/25" alt="">
            </div>
          </div>

          <!-- Huge Player Photo (Avatar) - Absolutely positioned on the right and filling the upper half -->
          <div class="absolute w-36 h-40 -right-2 top-3 select-none pointer-events-none z-0 overflow-visible">
            <img *ngIf="!item.isAdmin" [src]="item.avatar" 
                 class="w-full h-full object-contain filter drop-shadow-[0_8px_10px_rgba(0,0,0,0.6)]" 
                 style="mask-image: radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%); -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%);"
                 [alt]="item.name" loading="lazy">
            <div *ngIf="item.isAdmin" class="w-16 h-16 rounded-full bg-red-600/30 border border-red-500/30 flex items-center justify-center shadow-lg absolute right-6 top-10">
              <span class="text-red-500 font-black text-xl uppercase tracking-wider">Ad</span>
            </div>
          </div>

          <!-- Player Name - Styled to match FIFA overlay in the middle -->
          <div class="absolute top-[52%] left-0 w-full z-15 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <h3 class="text-sm font-black uppercase tracking-wider text-white truncate font-sans">
              {{ item.name }}
            </h3>
          </div>

          <!-- Floating Stats Grid -->
          <div class="absolute top-[60%] left-0 w-full z-10 flex justify-center items-center py-2 text-white select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <!-- Left column -->
            <div class="flex flex-col space-y-1.5 items-end pr-5 w-1/2">
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.pac }}</span>
                <span class="text-[9px] font-bold text-slate-300">PAC</span>
              </div>
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.sho }}</span>
                <span class="text-[9px] font-bold text-slate-300">SHO</span>
              </div>
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.pas }}</span>
                <span class="text-[9px] font-bold text-slate-300">PAS</span>
              </div>
            </div>
            <!-- Right column -->
            <div class="flex flex-col space-y-1.5 items-start pl-5 w-1/2">
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.dri }}</span>
                <span class="text-[9px] font-bold text-slate-300">DRI</span>
              </div>
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.def }}</span>
                <span class="text-[9px] font-bold text-slate-300">DEF</span>
              </div>
              <div class="flex items-center gap-1.5 leading-none">
                <span class="text-sm font-black font-mono tracking-tight">{{ item.phy }}</span>
                <span class="text-[9px] font-bold text-slate-300">PHY</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Arrow Right -->
      <button type="button" (click)="rotateRight()" 
              [ngClass]="isWeb ? 'flex' : 'hidden md:flex'"
              class="absolute right-4 z-30 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>

    </div>
  `,
  styles: [`
    .carousel-container {
      perspective: 1000px;
    }
    .carousel-stage {
      transform-style: preserve-3d;
    }
    .carousel-item {
      backface-visibility: hidden;
      transform-style: preserve-3d;
    }
    .fifa-card-shape {
      clip-path: url(#fifa-shield);
    }
  `]
})
export class ProfileCarouselComponent implements OnInit {
  state = inject(StateService);
  isWeb = !Capacitor.isNativePlatform();

  @Output() profileSelected = new EventEmitter<number | 'admin'>();

  activeIndex = signal<number>(0);
  items: CarouselItem[] = [];

  private touchStartX = 0;

  ngOnInit() {
    this.buildItems();
  }

  private buildItems() {
    // Definimos estadísticas del Mundial 2026 para cada chaval
    const defaultStats: { rating: number; position: string; flag: string; pac: number; sho: number; pas: number; dri: number; def: number; phy: number; }[] = [
      { rating: 89, position: 'LI', flag: 'es', pac: 88, sho: 89, pas: 95, dri: 85, def: 89, phy: 85 }, // Ibra
      { rating: 87, position: 'DEL', flag: 'es', pac: 93, sho: 87, pas: 88, dri: 83, def: 82, phy: 88 }, // Ali
      { rating: 87, position: 'ED', flag: 'ma', pac: 85, sho: 86, pas: 94, dri: 85, def: 91, phy: 86 }, // Derdabi
      { rating: 86, position: 'MCO', flag: 'es', pac: 90, sho: 85, pas: 90, dri: 90, def: 80, phy: 80 }, // Chakron
      { rating: 85, position: 'DC', flag: 'es', pac: 80, sho: 87, pas: 84, dri: 86, def: 78, phy: 90 }  // Afassi
    ];

    const list: CarouselItem[] = this.state.profiles().map((p, idx) => {
      const stats = defaultStats[idx] || { rating: 85, position: 'MC', flag: 'es', pac: 80, sho: 80, pas: 80, dri: 80, def: 80, phy: 80 };
      return {
        id: p.id,
        name: p.name,
        avatar: PROFILE_AVATARS[p.id] || 'assets/ibraCarta.png',
        isAdmin: false,
        ...stats
      };
    });

    list.push({
      id: 'admin',
      name: 'Admin',
      avatar: 'copa.png',
      isAdmin: true,
      rating: 99,
      position: 'DIR',
      flag: 'jp',
      pac: 99,
      sho: 99,
      pas: 99,
      dri: 99,
      def: 99,
      phy: 99
    });

    this.items = list;

    if (this.items.length > 0) {
      this.activeIndex.set(0);
      this.profileSelected.emit(this.items[0].id);
    }
  }

  selectItem(index: number) {
    this.activeIndex.set(index);
    this.profileSelected.emit(this.items[index].id);
  }

  rotateLeft() {
    const count = this.items.length;
    if (count === 0) return;
    const nextIdx = (this.activeIndex() - 1 + count) % count;
    this.selectItem(nextIdx);
  }

  rotateRight() {
    const count = this.items.length;
    if (count === 0) return;
    const nextIdx = (this.activeIndex() + 1) % count;
    this.selectItem(nextIdx);
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchEndX - this.touchStartX;
    const threshold = 50;
    if (diff > threshold) {
      this.rotateLeft();
    } else if (diff < -threshold) {
      this.rotateRight();
    }
  }

  getItemStyle(idx: number): Record<string, string> {
    const activeIdx = this.activeIndex();
    const count = this.items.length;
    if (count === 0) return {};

    let diff = (idx - activeIdx) % count;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;

    const absDiff = Math.abs(diff);

    const xOffset = 145;
    const zOffset = -150;
    const scaleFactor = 0.82;
    const opacityFactor = 0.55;
    const blurPx = 3;

    const tx = diff * xOffset;
    const tz = absDiff * zOffset;
    const ry = diff * -18;
    const scale = Math.pow(scaleFactor, absDiff);
    const opacity = Math.max(0.15, 1 - absDiff * opacityFactor);
    const zIndex = 100 - absDiff;
    const blur = absDiff > 0 ? `blur(${absDiff * blurPx}px)` : 'none';

    let bg = "url('assets/fondo_carta.png')";
    let shadow = 'none';

    if (activeIdx === idx) {
      if (this.items[idx].isAdmin) {
        shadow = '0 0 25px rgba(239, 68, 68, 0.4), 0 0 45px rgba(0,0,0,0.6)';
      } else {
        shadow = '0 0 25px rgba(245, 158, 11, 0.35), 0 0 45px rgba(0,0,0,0.6)';
      }
    }

    return {
      'transform': `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
      'opacity': String(opacity),
      'z-index': String(zIndex),
      'filter': blur,
      'background-image': bg,
      'background-size': 'cover',
      'background-position': 'center',
      'box-shadow': shadow
    };
  }
}
