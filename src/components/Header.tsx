import { CloudRain, Library, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenTapeRack: () => void;
  onOpenAbout: () => void;
  nightRain: boolean;
  onToggleNightRain: () => void;
  songCount: number;
}

export default function Header({
  onOpenAdmin,
  onOpenTapeRack,
  onOpenAbout,
  nightRain,
  onToggleNightRain,
  songCount,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-4 border-b border-[#5B0E14]/40 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark in Pure White #ffffff & Warm Vintage Cream #f1e194 */}
      <a
        href="#"
        className="text-base sm:text-lg font-cinzel font-bold tracking-wider text-[#ffffff] hover:text-[#f1e194] whitespace-nowrap shrink-0 flex items-center gap-2.5 group transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-[#5B0E14] border border-[#f1e194]/70 flex items-center justify-center text-[10px] text-[#ffffff] font-black shadow-[0_0_12px_rgba(91,14,20,0.6)] group-hover:scale-105 transition-transform">
          🍕
        </span>
        <span className="leading-none text-[#ffffff] group-hover:text-[#f1e194] transition-colors">
          HACKY PIZZA TOWN
        </span>
      </a>

      {/* Zone 2: Navigation Links in Clean Hinglish */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-[#ffffff]/80">
        <span className="text-[#f1e194] tracking-wide whitespace-nowrap shrink-0 flex items-center gap-1.5 font-cinzel">
          <Sparkles className="w-3.5 h-3.5 text-[#f1e194]" />
          <span>Cafe &amp; Lo-Fi Lounge</span>
        </span>
        <button
          onClick={onOpenTapeRack}
          className="hover:text-[#f1e194] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Library className="w-3.5 h-3.5 text-[#f1e194]" />
          <span>Vinyl Collection / Gaano Ki List ({songCount})</span>
        </button>
        <button
          onClick={onOpenAbout}
          className="hover:text-[#f1e194] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span>Hamari Kahani</span>
        </button>
      </nav>

      {/* Zone 3: Night Rain Audio Toggle & Discreet Staff Gear Icon */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleNightRain}
          title="Raat Ki Baarish On/Off Karein"
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
            nightRain
              ? 'bg-[#5B0E14]/90 border-[#f1e194] text-[#f1e194] shadow-[0_0_12px_rgba(241,225,148,0.35)]'
              : 'bg-[#000000]/60 border-[#5B0E14] text-[#ffffff]/70 hover:text-[#ffffff] hover:border-[#f1e194]'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Raat Ki Baarish</span>
        </button>

        {/* Discreet Gear Icon for Staff Admin */}
        <button
          onClick={onOpenAdmin}
          className="p-2 text-[#ffffff]/70 hover:text-[#f1e194] hover:bg-[#5B0E14]/40 rounded-lg transition-colors border border-transparent hover:border-[#f1e194]/40"
          title="Staff Admin Panel (PIN: 1234)"
        >
          <span className="sr-only">Staff Admin</span>
          ⚙️
        </button>
      </div>
    </header>
  );
}
