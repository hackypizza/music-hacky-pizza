import { useState } from 'react';
import { X, Search, Disc, Play, Plus, Clock } from 'lucide-react';
import { Song } from '../types';

interface TapeRackDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song) => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenAdmin: () => void;
}

export default function TapeRackDrawer({
  isOpen,
  onClose,
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenAdmin,
}: TapeRackDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredSongs = songs.filter((song) => {
    const matchesCategory =
      selectedCategory === 'All' || song.category === selectedCategory;
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#000000]/95 border-2 border-[#5B0E14] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(91,14,20,0.4)] overflow-hidden text-[#ffffff]">
        {/* Drawer Header in Hinglish */}
        <div className="bg-[#5B0E14]/30 border-b border-[#5B0E14] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#5B0E14] rounded-xl border border-[#f1e194]/40">
              <Disc className="w-5 h-5 text-[#f1e194]" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#ffffff] tracking-wider">
                VINYL COLLECTION · GAANO KI LIST
              </h2>
              <p className="text-xs text-[#f1e194]/80 font-mono">
                {songs.length} gaane available hain kitchen counter par
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="text-xs font-mono font-bold px-3 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194]/60 rounded-lg transition-colors flex items-center gap-1 shadow active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#f1e194]" />
              <span>NAYA GAANA ADD KAREIN</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#ffffff]/60 hover:text-[#f1e194] hover:bg-[#5B0E14]/40 rounded-lg transition-colors"
              title="List Band Karein"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar & Search */}
        <div className="p-4 bg-[#000000]/80 border-b border-[#5B0E14]/60 flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#f1e194] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Gaana, artist ya apni vibe search karein (e.g. 90s, chill, romantic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#000000] border border-[#5B0E14] rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 focus:outline-none focus:border-[#f1e194]"
            />
          </div>

          {/* Category Tabs (Segmented control) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
            <button
              onClick={() => onSelectCategory('All')}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 border ${
                selectedCategory === 'All'
                  ? 'bg-[#f1e194] text-[#000000] font-bold border-[#ffffff] shadow-sm'
                  : 'bg-[#5B0E14]/30 text-[#ffffff]/80 border-[#5B0E14] hover:bg-[#5B0E14]'
              }`}
            >
              Sabhi Gaane ({songs.length})
            </button>
            {categories.map((cat) => {
              const count = songs.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap shrink-0 border ${
                    selectedCategory === cat
                      ? 'bg-[#f1e194] text-[#000000] font-bold border-[#ffffff] shadow-sm'
                      : 'bg-[#5B0E14]/30 text-[#ffffff]/80 border-[#5B0E14] hover:bg-[#5B0E14]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Vinyl Shelf List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-12 text-[#f1e194]/60 font-mono text-xs">
              Aapki search ke mutabiq koi gaana nahi mila.
            </div>
          ) : (
            filteredSongs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-[#5B0E14]/50 border-[#f1e194] shadow-[0_0_15px_rgba(241,225,148,0.25)]'
                      : 'bg-[#000000]/70 border-[#5B0E14]/60 hover:bg-[#5B0E14]/30 hover:border-[#f1e194]/70'
                  }`}
                >
                  {/* Vinyl Spine & Number */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                        isCurrent
                          ? 'bg-[#f1e194] text-[#000000] border-[#ffffff] shadow-[0_0_8px_rgba(241,225,148,0.6)]'
                          : 'bg-[#5B0E14] text-[#f1e194] border-[#5B0E14] group-hover:border-[#f1e194]'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#000000] animate-ping" />
                      ) : (
                        <span>{(idx + 1).toString().padStart(2, '0')}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-cinzel text-sm font-bold text-[#ffffff] truncate group-hover:text-[#f1e194] transition-colors">
                        {song.title}
                      </div>
                      <div className="text-xs text-[#f1e194]/85 font-mono truncate">
                        {song.artist}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#ffffff]/60 font-mono mt-0.5">
                        <span className="text-[#f1e194]">{song.category}</span>
                        {song.chefMoodTag && (
                          <>
                            <span>·</span>
                            <span className="italic truncate text-[#ffffff]/50">
                              {song.chefMoodTag}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Play Action / Playing Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCurrent ? (
                      <span className="text-[11px] font-mono font-bold text-[#f1e194] bg-[#5B0E14] px-2.5 py-1 rounded-md border border-[#f1e194]">
                        {isPlaying ? 'ABHI BAJ RAHA HAI' : 'ROKA HUA HAI'}
                      </span>
                    ) : (
                      <button
                        className="p-2 rounded-lg bg-[#5B0E14]/40 group-hover:bg-[#f1e194] group-hover:text-[#000000] text-[#f1e194] border border-[#5B0E14] transition-colors"
                        title="Yeh Gaana Play Karein"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#000000]/90 border-t border-[#5B0E14] px-6 py-3 flex items-center justify-between text-[11px] font-mono text-[#ffffff]/60">
          <span>Kisi bhi gaane par click karein aur sukoon bhari dhunein suniye</span>
          <span className="flex items-center gap-1 text-[#f1e194]">
            <Clock className="w-3 h-3" />
            <span>Lo-Fi Lounge Collection</span>
          </span>
        </div>
      </div>
    </div>
  );
}
