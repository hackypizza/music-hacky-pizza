import { useState, useEffect, useCallback, useMemo } from 'react';
import { Song, ItalianVibeTag } from './types';
import { INITIAL_PLAYLIST, DEFAULT_CATEGORIES } from './data/initialPlaylist';
import { ambientSound } from './utils/ambientSound';
import Header from './components/Header';
import AnimeBackground from './components/AnimeBackground';
import PlayerControls from './components/PlayerControls';
import TapeRackDrawer from './components/TapeRackDrawer';
import AdminModal from './components/AdminModal';
import AboutModal from './components/AboutModal';
import YouTubeEngine from './components/YouTubeEngine';
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Plus,
  Music2,
  Disc,
} from 'lucide-react';
import cafeCounterBg from './assets/images/anime_cafe_counter_1792569343423.jpg';
import {
  fetchPlaylistFromSupabase,
  deleteCategoryFromSupabase,
  supabase,
} from './utils/supabase';
import { getYouTubeThumbnail } from './utils/youtube';

export default function App() {
  // Playlist state (defaults to INITIAL_PLAYLIST until Supabase responds)
  const [songs, setSongs] = useState<Song[]>(INITIAL_PLAYLIST);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Search query & category filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ItalianVibeTag>('All');

  // Supabase Sync States
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isTableMissing, setIsTableMissing] = useState<boolean>(false);
  const [isTableEmpty, setIsTableEmpty] = useState<boolean>(false);

  // Current track playback state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Ambient sound synthesizer
  const [vinylCrackle, setVinylCrackle] = useState<boolean>(false);
  const [nightRain, setNightRain] = useState<boolean>(true);

  // Modals state
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isTapeRackOpen, setIsTapeRackOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Transient notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  // 1. Live Playlist Sync from Supabase on load
  const loadSongsFromSupabase = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const result = await fetchPlaylistFromSupabase();

      if (result.isTableMissing) {
        setIsTableMissing(true);
        setIsDbConnected(false);
        setIsTableEmpty(false);
        setSongs(INITIAL_PLAYLIST);
        showToast('Supabase se jude. Table ready hone tak sample gaane chal rahe hain.');
        return;
      }

      setIsTableMissing(false);
      setIsDbConnected(true);

      if (result.songs.length > 0) {
        setIsTableEmpty(false);
        setSongs(result.songs);

        // Dynamically extract all unique categories from the Supabase 'playlist' table
        const dbCategories = Array.from(
          new Set(
            result.songs
              .map((s) => s.category?.trim())
              .filter((c): c is string => Boolean(c) && c !== 'All')
          )
        );

        setCategories((prev) => {
          const combined = Array.from(new Set([...prev, ...dbCategories]));
          return combined.length > 0 ? combined : DEFAULT_CATEGORIES;
        });

        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
        showToast(`Supabase se ${result.songs.length} gaane load ho gaye! Playback shuru ho gaya.`);
      } else {
        setIsTableEmpty(true);
        setSongs(INITIAL_PLAYLIST);
        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
        showToast('Supabase table khali hai: Sample lo-fi gaana chal raha hai.');
      }
    } catch (err: unknown) {
      console.warn('Sync exception:', err);
      setSongs(INITIAL_PLAYLIST);
    } finally {
      setIsDbLoading(false);
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    loadSongsFromSupabase();
  }, [loadSongsFromSupabase]);

  // Realtime Supabase Channel Subscription
  useEffect(() => {
    try {
      const channel = supabase
        .channel('supabase-playlist-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'playlist' },
          () => {
            loadSongsFromSupabase();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Ignore
    }
  }, [loadSongsFromSupabase]);

  // Track switching handlers
  const handleNextTrack = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % songs.length);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [songs.length]);

  const handlePrevTrack = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [songs.length]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    setSeekTarget(seconds);
    setCurrentTime(seconds);
    setTimeout(() => {
      setSeekTarget(null);
    }, 150);
  }, []);

  const handleTimeUpdate = useCallback((curr: number, dur: number) => {
    setCurrentTime(curr);
    if (dur > 0) {
      setDuration(dur);
    }
  }, []);

  // Ambient Sounds Toggles
  const handleToggleNightRain = useCallback(() => {
    setNightRain((prev) => {
      const next = !prev;
      if (next) {
        ambientSound.startRain(0.28);
      } else {
        ambientSound.stopRain();
      }
      return next;
    });
  }, []);

  const handleToggleVinylCrackle = useCallback(() => {
    setVinylCrackle((prev) => {
      const next = !prev;
      if (next) {
        ambientSound.startVinyl(0.18);
      } else {
        ambientSound.stopVinyl();
      }
      return next;
    });
  }, []);

  // Filtered Songs by Search Query and Category
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesCategory =
        selectedCategory === 'All' || song.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.category && song.category.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [songs, selectedCategory, searchQuery]);

  // Play a selected song from the playlist
  const handleSelectSong = (song: Song) => {
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx !== -1) {
      if (currentIndex === idx) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentIndex(idx);
        setCurrentTime(0);
        setIsPlaying(true);
      }
    }
  };

  const currentSong = songs[currentIndex] || null;

  // Add new category directly
  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed || trimmed === 'All') return;
    setCategories((prev) => Array.from(new Set([...prev, trimmed])));
  };

  // Delete category and update Supabase + local state
  const handleDeleteCategory = async (
    categoryToDelete: string,
    action: 'reassign_to_all' | 'delete_tracks'
  ) => {
    const { success, affectedCount, error } = await deleteCategoryFromSupabase(
      categoryToDelete,
      action
    );

    if (!success) {
      showToast(`Category delete karne me error: ${error}`);
      return;
    }

    setCategories((prev) => prev.filter((c) => c !== categoryToDelete));

    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }

    if (action === 'reassign_to_all') {
      setSongs((prev) =>
        prev.map((s) => (s.category === categoryToDelete ? { ...s, category: 'All' } : s))
      );
      showToast(`Category "${categoryToDelete}" hata di gayi. ${affectedCount} gaane 'Sabhi Gaane' me chale gaye.`);
    } else {
      setSongs((prev) => prev.filter((s) => s.category !== categoryToDelete));
      showToast(`Category "${categoryToDelete}" aur ${affectedCount} gaane delete kar diye gaye.`);
    }

    await loadSongsFromSupabase();
  };

  // Import JSON playlist
  const handleImportPlaylist = (imported: Song[]) => {
    setSongs(imported);
    const newCats = Array.from(
      new Set([...categories, ...imported.map((s) => s.category).filter(Boolean)])
    );
    setCategories(newCats);
    setCurrentIndex(0);
    setCurrentTime(0);
    showToast(`JSON file se ${imported.length} gaane jud gaye!`);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff] relative flex flex-col justify-between selection:bg-[#5B0E14] selection:text-[#f1e194] overflow-x-hidden">
      {/* 1. Full-Screen Anime Italian Cafe Counter Background */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <img
          src={cafeCounterBg}
          alt="Anime Italian Cafe Counter Entrance View"
          className="w-full h-full object-cover object-center animate-ken-burns scale-105"
        />
        {/* Subtle Dark Vignette Overlay in Deep Black #000000 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/80 via-[#000000]/70 to-[#000000]/85 backdrop-blur-[1.5px]" />

        {/* Warm Cafe Oven Ember Lighting */}
        <div
          className="absolute top-[35%] right-[20%] w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full pointer-events-none animate-oven-breathe mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle, rgba(241, 225, 148, 0.35) 0%, rgba(91, 14, 20, 0.3) 40%, rgba(0, 0, 0, 0) 70%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* 2. Floating Golden Dust / Embers (#f1e194) & Rain Streaks on Window */}
      <AnimeBackground nightRainActive={nightRain} />

      {/* 3. Subtle Film Grain */}
      <div className="fixed inset-0 grain-overlay z-10 pointer-events-none opacity-25" />

      {/* 4. Hidden YouTube Audio Engine with Mobile Keep-Alive & MediaSession */}
      <YouTubeEngine
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        seekTarget={seekTarget}
        onTrackEnd={handleNextTrack}
        onTimeUpdate={handleTimeUpdate}
        onStateChange={(state) => setIsPlaying(state)}
        onError={(err) => showToast(err)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
      />

      {/* 5. Top Header: Cafe branding, Search bar & Category pills */}
      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        nightRain={nightRain}
        onToggleNightRain={handleToggleNightRain}
        songCount={songs.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 6. Main Body: Clean, Scrollable Playlist Table/Feed & Admin Button */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8 z-20 relative pb-32">
        {/* Playlist Feed Header Card */}
        <div className="bg-gradient-to-r from-[#5B0E14]/40 via-[#000000]/90 to-[#5B0E14]/40 border-2 border-[#5B0E14] rounded-2xl p-4 sm:p-5 mb-5 shadow-[0_15px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-[#5B0E14] text-[#f1e194] border border-[#f1e194]/40">
                <Music2 className="w-4 h-4" />
              </span>
              <h2 className="font-cinzel font-bold text-lg sm:text-xl text-[#ffffff] tracking-wider">
                SAVED PLAYLIST (SUPABASE CLOUD)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#f1e194]/80">
              <span>{filteredSongs.length} gaane available</span>
              <span>·</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Database Connected</span>
              </span>
            </div>
          </div>

          {/* Prominent Admin Access Button */}
          <button
            onClick={() => setIsAdminOpen(true)}
            className="px-4 py-2 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] rounded-xl font-cinzel font-bold text-xs tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(91,14,20,0.5)] active:translate-y-0.5 shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4 text-[#f1e194]" />
            <span>Naya Gaana Jodein (Staff Admin) 🍕</span>
          </button>
        </div>

        {/* Database Empty / Pending Alert */}
        {(isTableEmpty || isTableMissing) && (
          <div className="w-full mb-5 p-3.5 bg-[#000000]/90 border border-[#5B0E14] rounded-xl text-xs font-mono text-center backdrop-blur-md">
            <p className="text-[#f1e194] font-bold">
              {isTableEmpty
                ? 'Supabase table abhi khali hai · Sample lo-fi gaana chal raha hai'
                : 'Supabase se connect ho gaya · Pizzeria ka lo-fi track chal raha hai'}
            </p>
            <p className="text-[#ffffff]/70 text-[11px] mt-1">
              Naye gaane jodne ke liye kholein:{' '}
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-[#f1e194] underline hover:text-[#ffffff] font-bold"
              >
                Staff Admin Panel ⚙️ (PIN: 1234)
              </button>
            </p>
          </div>
        )}

        {/* Playlist Table / Card Feed */}
        <div className="bg-[#000000]/90 border-2 border-[#5B0E14] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {filteredSongs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Disc className="w-10 h-10 text-[#f1e194]/40 mx-auto mb-3 animate-spin-slow" />
              <h3 className="font-cinzel font-bold text-base text-[#ffffff] mb-1">
                Koi Gaana Nahi Mila
              </h3>
              <p className="text-xs font-mono text-[#f1e194]/70 mb-4 max-w-sm mx-auto">
                {searchQuery
                  ? `"${searchQuery}" ke mutabiq koi gaana nahi mila. Search saaf karein ya naya gaana add karein.`
                  : 'Abhi koi gaana nahi joda gaya hai. Pehla gaana Staff Admin panel se jodein!'}
              </p>
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-4 py-2 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] rounded-xl text-xs font-mono font-bold transition-all shadow"
              >
                + Pehla Gaana Add Karein
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#5B0E14]/40">
              {filteredSongs.map((song, idx) => {
                const isCurrent = currentSong?.id === song.id;
                const thumb = getYouTubeThumbnail(song.youtubeId);

                return (
                  <div
                    key={song.id}
                    onClick={() => handleSelectSong(song)}
                    className={`p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#5B0E14]/45 border-l-4 border-l-[#f1e194] shadow-[inset_0_0_20px_rgba(241,225,148,0.15)]'
                        : 'hover:bg-[#5B0E14]/25 hover:border-l-4 hover:border-l-[#f1e194]/60'
                    }`}
                  >
                    {/* Left: Track Index, Thumbnail, Title & Artist */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Track Index or Animated Waveform */}
                      <div className="w-6 text-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-0.5 h-4">
                            <span className="w-1 bg-[#f1e194] wave-bar-1 rounded-full" />
                            <span className="w-1 bg-[#f1e194] wave-bar-2 rounded-full" />
                            <span className="w-1 bg-[#f1e194] wave-bar-3 rounded-full" />
                          </div>
                        ) : (
                          <span
                            className={`font-mono text-xs ${
                              isCurrent ? 'text-[#f1e194] font-bold' : 'text-[#ffffff]/50'
                            }`}
                          >
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>

                      {/* Small Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg bg-[#1c0507] border border-[#5B0E14] overflow-hidden shrink-0 group shadow">
                        <img
                          src={thumb}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div
                          className={`absolute inset-0 flex items-center justify-center bg-[#000000]/50 transition-opacity ${
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 text-[#f1e194] fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-[#f1e194] fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Title & Artist */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-bold text-sm sm:text-base truncate leading-tight ${
                              isCurrent
                                ? 'text-[#ffffff] drop-shadow-[0_0_10px_rgba(241,225,148,0.5)]'
                                : 'text-[#ffffff] group-hover:text-[#f1e194]'
                            }`}
                          >
                            {song.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-mono font-bold bg-[#f1e194] text-[#000000] px-1.5 py-0.2 rounded shrink-0">
                              NOW PLAYING
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#f1e194]/80 truncate mt-0.5">
                          {song.artist || 'Hacky Pizza Lounge'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Category Badge & Play Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Mood / Category Badge */}
                      <span className="hidden sm:inline-block px-2.5 py-1 bg-[#5B0E14] text-[#f1e194] border border-[#f1e194]/30 rounded-md text-[11px] font-mono font-bold">
                        {song.category || 'All'}
                      </span>

                      {/* Quick Play/Pause Action Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSong(song);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent && isPlaying
                            ? 'bg-[#f1e194] text-[#000000] shadow-[0_0_10px_rgba(241,225,148,0.6)]'
                            : 'bg-[#000000]/70 hover:bg-[#5B0E14] text-[#f1e194] border border-[#5B0E14] hover:border-[#f1e194]'
                        }`}
                        title={isCurrent && isPlaying ? 'Roko' : 'Play Karein'}
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 7. Bottom Sticky / Fixed Mini Player Bar */}
      <PlayerControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        vinylCrackle={vinylCrackle}
        nightRain={nightRain}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        onVolumeChange={(v) => setVolume(v)}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleVinylCrackle={handleToggleVinylCrackle}
        onToggleNightRain={handleToggleNightRain}
        hasSongs={songs.length > 0}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#000000]/95 border border-[#f1e194] text-[#f1e194] text-xs font-mono px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.95)] flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 max-w-md text-center">
          <span className="w-2 h-2 rounded-full bg-[#f1e194] animate-ping shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <TapeRackDrawer
        isOpen={isTapeRackOpen}
        onClose={() => setIsTapeRackOpen(false)}
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onSelectSong={handleSelectSong}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        songs={songs}
        categories={categories}
        isDbConnected={isDbConnected}
        isTableMissing={isTableMissing}
        onRefreshFromSupabase={loadSongsFromSupabase}
        onDeleteCategory={handleDeleteCategory}
        onAddCategory={handleAddCategory}
        onPlaySong={handleSelectSong}
        onImportPlaylist={handleImportPlaylist}
      />

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
