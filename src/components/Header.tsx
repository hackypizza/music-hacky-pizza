import { CloudRain, Sparkles, Search, X, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin: () => void;
  onOpenAbout: () => void;
  nightRain: boolean;
  onToggleNightRain: () => void;
  songCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export default function Header({
  onOpenAdmin,
  onOpenAbout,
  nightRain,
  onToggleNightRain,
  songCount,
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
}: HeaderProps) {
  return (
    <header className="border-b border-[#5B0E14]/70 bg-[#000000]/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
      {/* Top Bar: Wordmark, Search, and Action Toggles */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Wordmark & Cafe Tagline */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="text-base sm:text-lg font-cinzel font-bold tracking-wider text-[#ffffff] hover:text-[#f1e194] whitespace-nowrap shrink-0 flex items-center gap-2.5 group transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-[#5B0E14] border border-[#f1e194]/70 flex items-center justify-center text-sm shadow-[0_0_12px_rgba(91,14,20,0.6)] group-hover:scale-105 transition-transform">
              🍕
            </span>
            <div className="leading-tight">
              <span className="block text-sm sm:text-base font-cinzel font-bold text-[#ffffff] group-hover:text-[#f1e194] transition-colors">
                HACKY PIZZA TOWN
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-[#f1e194]/80 tracking-normal">
                Garma-garam Pizza, Thandi Hawa aur Dilchasp Dhunein
              </span>
            </div>
          </a>
        </div>

        {/* Search Bar in Header */}
        <div className="flex-1 max-w-md min-w-[220px] order-3 sm:order-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#f1e194]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Gaana, artist ya vibe search karein..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#000000]/80 border border-[#5B0E14] focus:border-[#f1e194] rounded-xl pl-9 pr-8 py-1.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ffffff]/60 hover:text-[#f1e194]"
                title="Search saaf karein"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions: Staff Admin, Rain Toggle, About */}
        <div className="flex items-center gap-2 order-2 sm:order-3 ml-auto sm:ml-0">
          {/* Quick Staff Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194]/70 rounded-xl font-cinzel font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(91,14,20,0.5)] active:translate-y-0.5"
            title="Kitchen Staff Admin Panel (PIN: 1234)"
          >
            <Plus className="w-3.5 h-3.5 text-[#f1e194]" />
            <span className="hidden md:inline">Gaana Add Karein</span>
            <span className="md:hidden">Add</span>
          </button>

          {/* Night Rain Toggle */}
          <button
            onClick={onToggleNightRain}
            title={nightRain ? 'Raat Ki Baarish: CHALU' : 'Raat Ki Baarish: BAND'}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-mono rounded-xl border transition-all flex items-center gap-1.5 ${
              nightRain
                ? 'bg-[#5B0E14]/90 border-[#f1e194] text-[#f1e194] shadow-[0_0_10px_rgba(241,225,148,0.3)]'
                : 'bg-[#000000]/60 border-[#5B0E14] text-[#ffffff]/60 hover:text-[#ffffff] hover:border-[#f1e194]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Baarish</span>
          </button>

          {/* Hamari Kahani modal toggle */}
          <button
            onClick={onOpenAbout}
            className="p-1.5 text-[#ffffff]/70 hover:text-[#f1e194] hover:bg-[#5B0E14]/40 rounded-xl transition-colors border border-transparent hover:border-[#f1e194]/40 text-xs font-mono"
            title="Cafe Story / Hamari Kahani"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f1e194]" />
          </button>
        </div>
      </div>

      {/* Category Pills Row (Horizontally Scrollable) */}
      <div className="border-t border-[#5B0E14]/40 bg-[#000000]/60 px-4 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono">
          <button
            onClick={() => onSelectCategory('All')}
            className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 border ${
              selectedCategory === 'All'
                ? 'bg-[#5B0E14] border-[#f1e194] text-[#ffffff] font-bold shadow-[0_0_12px_rgba(241,225,148,0.35)]'
                : 'bg-[#000000]/70 border-[#5B0E14]/60 text-[#ffffff]/75 hover:text-[#f1e194] hover:border-[#f1e194]'
            }`}
          >
            Sabhi Gaane ({songCount})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-[#5B0E14] border-[#f1e194] text-[#ffffff] font-bold shadow-[0_0_12px_rgba(241,225,148,0.35)]'
                  : 'bg-[#000000]/70 border-[#5B0E14]/60 text-[#ffffff]/75 hover:text-[#f1e194] hover:border-[#f1e194]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
