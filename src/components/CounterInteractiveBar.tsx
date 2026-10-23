import { useState } from 'react';
import { Bell, Utensils, ChefHat, Sparkles } from 'lucide-react';
import { ambientSound } from '../utils/ambientSound';

interface CounterInteractiveBarProps {
  onOpenMenu: () => void;
  onOpenAdmin: () => void;
}

export default function CounterInteractiveBar({
  onOpenMenu,
  onOpenAdmin,
}: CounterInteractiveBarProps) {
  const [isRinging, setIsRinging] = useState(false);
  const [bellToast, setBellToast] = useState<string | null>(null);

  const handleRingBell = () => {
    ambientSound.playBell();
    setIsRinging(true);
    setBellToast('🔔 Ting! Order ready hai 🍕');
    setTimeout(() => setIsRinging(false), 600);
    setTimeout(() => setBellToast(null), 3000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-4 relative z-20">
      {/* Wood-Carved / Warm Neon Sign Above the Counter */}
      <div className="text-center mb-4">
        <div className="inline-block relative px-6 py-2 rounded-xl bg-[#1a0f0a]/85 border-2 border-[#b45309]/80 shadow-[0_0_25px_rgba(245,158,11,0.35),inset_0_2px_4px_rgba(255,255,255,0.1)] backdrop-blur-md">
          {/* Subtle Corner Brackets */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-amber-400" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-amber-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-amber-400" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-amber-400" />

          <h2 className="font-cinzel font-black text-lg sm:text-xl md:text-2xl tracking-widest text-[#fef08a] neon-lantern-glow uppercase">
            HACKY PIZZA TOWN — OVEN &amp; CAFE
          </h2>
          <div className="text-[10px] font-mono tracking-widest text-amber-300/80 uppercase mt-0.5 flex items-center justify-center gap-2">
            <span>🍕 Garma-garam Pizza</span>
            <span>·</span>
            <span>☕ Kadak Espresso</span>
            <span>·</span>
            <span>📻 Lo-Fi Beats</span>
          </div>
        </div>
      </div>

      {/* Interactive Service Counter Surface Bar */}
      <div className="bg-gradient-to-r from-[#2c1810]/95 via-[#3b2014]/95 to-[#2c1810]/95 border-2 border-[#68331d] rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Interactive Counter Service Bell */}
        <div className="relative">
          <button
            onClick={handleRingBell}
            title="Kitchen bell bajayein (Order Ready)"
            className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-[#1a0f0a] font-mono font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-200 transition-all active:scale-95"
          >
            <span
              className={`p-1 bg-[#1a0f0a] text-amber-400 rounded-lg ${
                isRinging ? 'animate-bell-ring' : 'group-hover:rotate-12'
              } transition-transform`}
            >
              <Bell className="w-4 h-4 fill-current" />
            </span>
            <div className="text-left">
              <span className="block font-cinzel font-black text-[11px] leading-tight">
                KITCHEN BELL
              </span>
              <span className="text-[9px] text-[#2c1810] font-mono block leading-tight">
                Click karke bajayein (Ting!)
              </span>
            </div>
          </button>

          {/* Service Bell Ding Toast Bubble */}
          {bellToast && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-[#12161f] border border-amber-400 text-amber-200 text-xs font-mono px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap animate-in fade-in duration-150">
              {bellToast}
            </div>
          )}
        </div>

        {/* Center: Chalkboard Menu Specials Access */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1c2433]/90 hover:bg-[#253247] text-amber-200 hover:text-white border border-[#3b4c68] transition-all text-xs font-mono shadow-md group"
          title="Chef ke specials menu kholein"
        >
          <Utensils className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-cinzel font-bold text-xs">Chef Ke Khaas Specials</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </button>

        {/* Right: Integrated Kitchen Door Staff Pass */}
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a0f0a] hover:bg-[#2d1b13] text-amber-300 border border-[#5c2b18] hover:border-amber-500 transition-all text-xs font-mono shadow-inner group"
          title="Kitchen Staff Admin (PIN: 1234)"
        >
          <ChefHat className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <div className="text-left">
            <span className="font-mono text-[11px] font-bold block text-amber-200 leading-tight">
              Staff Portal
            </span>
            <span className="text-[9px] text-amber-500/70 block leading-tight">
              Admin Access
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
