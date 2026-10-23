import { X, Pizza, Sparkles, Coffee, CloudRain } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#000000]/95 border-2 border-[#5B0E14] rounded-2xl w-full max-w-lg p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(91,14,20,0.4)] text-[#ffffff] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#ffffff]/60 hover:text-[#f1e194] hover:bg-[#5B0E14]/40 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#5B0E14] border border-[#f1e194]/40 rounded-2xl text-[#f1e194] shadow-md">
            <Pizza className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-lg text-[#ffffff] tracking-wider">
              HACKY PIZZA TOWN
            </h3>
            <p className="text-xs text-[#f1e194] font-mono">
              Hamari Kahani · Trattoria, Pizzeria &amp; Lo-Fi Lounge
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs font-mono text-[#ffffff]/80 leading-relaxed border-t border-[#5B0E14]/60 pt-4">
          <p>
            Swagat hai aapka <strong className="text-[#f1e194] font-cinzel">Hacky Pizza Town</strong> me: yahan authentic Italian artisanal pizza aur Japanese Lo-Fi anime cafe ka sukoon ek saath milte hain (Studio Ghibli aur Makoto Shinkai jaisi shaam ki pyari vibe).
          </p>
          <p>
            Khidki ke bahar rimjhim baarish ki bundein, wood-fired oven se uthti garma-garam khushboo, crispy blistered crust, aur jukebox par chalte 90s aur chillhop ke dheeme dhun — yahi hai hamara thikana.
          </p>
          <div className="bg-[#5B0E14]/20 p-3.5 rounded-xl border border-[#5B0E14] space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-[#f1e194] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#f1e194]" />
              <span>Khaas Cafe Anubhav</span>
            </div>
            <ul className="space-y-1.5 text-[#ffffff]/70">
              <li className="flex items-center gap-2">
                <Coffee className="w-3.5 h-3.5 text-[#f1e194] shrink-0" />
                <span><strong>Garma-garam Steam:</strong> Hot pizza slice aur kadak espresso cup se nikalta animated dhuaan.</span>
              </li>
              <li className="flex items-center gap-2">
                <CloudRain className="w-3.5 h-3.5 text-[#f1e194] shrink-0" />
                <span><strong>Raat Ki Baarish &amp; Vinyl Scratch:</strong> Sukoon bhare ambient synthesizers jo aap apni marzi se chalu ya band kar sakte hain.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#5B0E14]/60 flex items-center justify-between text-[11px] font-mono text-[#ffffff]/60">
          <span className="flex items-center gap-1 text-[#f1e194]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Garma-garam Crusts &amp; Lo-Fi Beats</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] border border-[#f1e194] text-[#ffffff] font-cinzel font-bold rounded-xl transition-all text-xs active:translate-y-0.5"
          >
            Counter Par Wapas Jayein
          </button>
        </div>
      </div>
    </div>
  );
}
