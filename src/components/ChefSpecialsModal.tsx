import { X, Pizza, Coffee, Utensils, Play, Sparkles } from 'lucide-react';
import { Song } from '../types';

interface ChefSpecialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSongByCategory: (category: string) => void;
  songs: Song[];
}

export default function ChefSpecialsModal({
  isOpen,
  onClose,
  onSelectSongByCategory,
  songs,
}: ChefSpecialsModalProps) {
  if (!isOpen) return null;

  const specials = [
    {
      title: 'Pizza Margherita Verace',
      desc: 'San Marzano tamatar sauce, fresh molten mozzarella, taaza basil leaves aur olive oil.',
      price: '₹ 450',
      category: '90s Ka Magic',
      icon: '🍕',
      mood: 'Mood: Garma-garam Margherita Pizza & 90s Ka Magic',
    },
    {
      title: 'Doppio Espresso & Sweet Cannoli',
      desc: 'Dark roast Italian espresso shot, sunhera crema aur crunchy chocolate cannolo.',
      price: '₹ 220',
      category: 'Cafe Vibes',
      icon: '☕',
      mood: 'Mood: Kadak Espresso Shot & Meetha Cannoli',
    },
    {
      title: 'Herbed Garlic Focaccia Bread',
      desc: 'Wood-fired oven me paka taaza rosemary bread aur Himalayan pink salt.',
      price: '₹ 280',
      category: 'Late Night Lo-Fi',
      icon: '🥖',
      mood: 'Mood: Rimjhim Baarish, Focaccia & Dheemi Dhun',
    },
    {
      title: 'Soft Creamy Mascarpone Tiramisù',
      desc: 'Strong espresso me dipped savoiardi biscuits, creamy mascarpone aur rich cocoa powder.',
      price: '₹ 340',
      category: 'Sunday Special',
      icon: '🍰',
      mood: 'Mood: Creamy Tiramisu & Raat Ki Khamoshi',
    },
    {
      title: 'Wood-Fired Calzone Pocket',
      desc: 'Melting fior di latte cheese, fresh ricotta aur authentic Italian herbs.',
      price: '₹ 490',
      category: 'Late Night Lo-Fi',
      icon: '🔥',
      mood: 'Mood: Wood-Fired Oven Ki Garmi & Melting Cheese',
    },
  ];

  const handleOrderAndPlay = (category: string) => {
    onSelectSongByCategory(category);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Italian Chalkboard Blackboard Frame */}
      <div className="bg-[#12161f] border-4 border-[#3b2318] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden text-[#fefce8] relative">
        {/* Chalkboard Frame Inner Bevel */}
        <div className="bg-[#1a202c] border-b-2 border-[#472d1f] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c2410c] to-[#f59e0b] flex items-center justify-center text-lg shadow-md">
              🍕
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-200 tracking-wider">
                AAJ KA MENU · CHEF KE KHAAS SPECIALS
              </h2>
              <p className="text-xs font-mono text-amber-500/80">
                Wood-Fired Oven &amp; Lo-Fi Audio Pairings
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#2d3748] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chalkboard Body with specials list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#0f141d]">
          {specials.map((item, idx) => {
            const hasSong = songs.some((s) => s.category === item.category);

            return (
              <div
                key={idx}
                className="p-4 bg-[#141b27] border border-[#24334d] hover:border-amber-500/60 rounded-xl transition-all shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0 p-2 bg-[#090d15] rounded-xl border border-[#1e293b]">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-cinzel font-bold text-sm text-amber-100 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                    <div className="text-[10px] font-mono text-amber-500/90 mt-1 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.mood}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOrderAndPlay(item.category)}
                    className="px-3.5 py-2 bg-gradient-to-r from-[#c2410c] to-[#f59e0b] hover:from-[#ea580c] hover:to-[#fbbf24] text-[#090d15] font-cinzel font-bold text-xs tracking-wider rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)] active:translate-y-0.5 flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Order &amp; Play Karein</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chalkboard Footer */}
        <div className="bg-[#141b27] border-t border-[#24334d] px-6 py-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Sabhi pizzas 450°C wood-fired oven me bake hote hain</span>
          </span>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-amber-300 font-bold"
          >
            Menu Band Karein
          </button>
        </div>
      </div>
    </div>
  );
}
