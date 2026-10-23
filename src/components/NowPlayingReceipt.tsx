import { Song } from '../types';
import { Pizza, Flame, UtensilsCrossed } from 'lucide-react';

interface NowPlayingReceiptProps {
  currentSong: Song | null;
  isPlaying: boolean;
}

export default function NowPlayingReceipt({
  currentSong,
  isPlaying,
}: NowPlayingReceiptProps) {
  const chefMood =
    currentSong?.chefMoodTag || 'Tasting: Margherita Extra Cheese & 90s Beats';

  return (
    <div className="w-full max-w-2xl mx-auto my-3 select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
      {/* Thermal Receipt Paper Card */}
      <div className="relative bg-[#fefce8] text-[#1c1917] rounded-sm p-4 sm:p-5 border-t-4 border-dashed border-[#d4cebd] shadow-lg">
        {/* Jagged Perforated Receipt Top Edge Pattern */}
        <div className="absolute -top-2 inset-x-0 h-2 bg-radial from-transparent to-[#fefce8] opacity-50" />

        {/* Receipt Header */}
        <div className="border-b-2 border-dashed border-[#b8af96] pb-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#c2410c] text-white flex items-center justify-center">
              <Pizza className="w-4 h-4" />
            </div>
            <div>
              <div className="font-cinzel text-xs font-black tracking-wider text-[#9a3412] uppercase leading-none">
                HACKY PIZZA TOWN
              </div>
              <div className="text-[10px] font-mono text-[#78350f]">
                Order Receipt / Gaane Ka Bill · Table #07
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] font-mono text-[#57534e]">
            <div>ORDER: #HPZ-94</div>
            <div className="text-[#c2410c] font-bold">WOOD-FIRED OVEN #01</div>
          </div>
        </div>

        {/* Now Playing Details */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#78350f] font-bold">
                1x VINYL CASSETTE (ABHI BAJ RAHA HAI)
              </div>
              <div className="font-receipt text-2xl text-[#0c0a09] font-bold leading-tight truncate">
                {currentSong ? currentSong.title : 'GAANA SELECT KAREIN...'}
              </div>
              <div className="font-receipt text-lg text-[#44403c] leading-tight truncate">
                ARTIST: {currentSong ? currentSong.artist : 'Koi Gaana Selected Nahi Hai'}
              </div>
            </div>

            {/* Vintage Italian Chef Stamp */}
            <div className="shrink-0 transform rotate-6 border-2 border-red-700 text-red-700 px-2 py-1 rounded text-center opacity-90">
              <div className="text-[8px] font-mono font-bold leading-none">
                {isPlaying ? 'ABHI BAJ RAHA HAI' : 'ROKA HUA HAI'}
              </div>
              <div className="text-[10px] font-cinzel font-black leading-none mt-0.5">
                {isPlaying ? 'PIZZA BAKING' : 'ON HOLD'}
              </div>
            </div>
          </div>

          {/* Chef's Tasting Mood Tag */}
          <div className="bg-[#fef9c3] border border-[#fde047] rounded p-2.5 flex items-center gap-2 text-xs">
            <UtensilsCrossed className="w-4 h-4 text-[#c2410c] shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-[#854d0e] uppercase font-bold block">
                Chef Ka Mood Tag
              </span>
              <span className="font-typewriter text-xs text-[#713f12] font-bold truncate block">
                {chefMood}
              </span>
            </div>
          </div>

          {/* Category & Vibe footer strip */}
          <div className="pt-2 border-t border-dashed border-[#b8af96] flex items-center justify-between text-[10px] font-mono text-[#78350f]">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#c2410c]" />
              <span>VIBE: {currentSong?.category || '90s Ka Magic'}</span>
            </span>
            <span>SHUKRIYA · DIL SE SWAGAT HAI!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
