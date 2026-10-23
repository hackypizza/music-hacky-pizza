import { useState, useEffect, useCallback, useMemo } from 'react';
import { Song, ItalianVibeTag } from './types';
import { INITIAL_PLAYLIST, DEFAULT_CATEGORIES } from './data/initialPlaylist';
import { ambientSound } from './utils/ambientSound';
import Header from './components/Header';
import AnimeBackground from './components/AnimeBackground';
import TurntableVinyl from './components/TurntableVinyl';
import PlayerControls from './components/PlayerControls';
import TapeRackDrawer from './components/TapeRackDrawer';
import AdminModal from './components/AdminModal';
import AboutModal from './components/AboutModal';
import YouTubeEngine from './components/YouTubeEngine';
import { Sparkles, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import cafeCounterBg from './assets/images/anime_cafe_counter_1792569343423.jpg';
import {
  fetchPlaylistFromSupabase,
  deleteCategoryFromSupabase,
  supabase,
} from './utils/supabase';

export default function App() {
  // Playlist state (defaults to INITIAL_PLAYLIST until Supabase responds)
  const [songs, setSongs] = useState<Song[]>(INITIAL_PLAYLIST);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

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

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<ItalianVibeTag>('All');

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

  // 3. Live Playlist Sync from Supabase on load
  const loadSongsFromSupabase = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const result = await fetchPlaylistFromSupabase();

      if (result.isTableMissing) {
        setIsTableMissing(true);
        setIsDbConnected(false);
        setIsTableEmpty(false);
        // Fallback to cozy lo-fi tracks so music keeps playing smoothly
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
          // Merge current active categories with dynamically extracted DB categories
          const combined = Array.from(new Set([...prev, ...dbCategories]));
          return combined.length > 0 ? combined : DEFAULT_CATEGORIES;
        });

        // Feed them to the YouTube IFrame player engine and begin playing
        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
        showToast(`Supabase se ${result.songs.length} gaane load ho gaye! Playback shuru ho gaya.`);
      } else {
        // Table is empty: display friendly prompt and play fallback lo-fi track
        setIsTableEmpty(true);
        setSongs(INITIAL_PLAYLIST);
        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true); // Fallback lo-fi track playing
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
      // Ignore if channels not enabled
    }
  }, [loadSongsFromSupabase]);

  // Handle URL hash routing (#admin or /admin)
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (hash === '#admin' || hash === '#/admin' || pathname === '/admin') {
        setIsAdminOpen(true);
      }
    };
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  // Filtered song list based on active category
  const activePlaylist = useMemo(() => {
    if (selectedCategory === 'All') return songs;
    return songs.filter((s) => s.category === selectedCategory);
  }, [songs, selectedCategory]);

  const currentSong = songs[currentIndex] || songs[0] || null;

  // Track navigation
  const handleNextTrack = useCallback(() => {
    if (songs.length === 0) return;
    ambientSound.cleanupOnTrackChange();
    if (activePlaylist.length > 0) {
      const activeIdx = activePlaylist.findIndex((s) => s.id === currentSong?.id);
      const nextActive = activePlaylist[(activeIdx + 1) % activePlaylist.length];
      const nextGlobalIdx = songs.findIndex((s) => s.id === nextActive.id);
      setCurrentIndex(nextGlobalIdx !== -1 ? nextGlobalIdx : 0);
    } else {
      setCurrentIndex((prev) => (prev + 1) % songs.length);
    }
    setCurrentTime(0);
    setIsPlaying(true);
  }, [songs, activePlaylist, currentSong]);

  const handlePrevTrack = useCallback(() => {
    if (songs.length === 0) return;
    ambientSound.cleanupOnTrackChange();
    if (activePlaylist.length > 0) {
      const activeIdx = activePlaylist.findIndex((s) => s.id === currentSong?.id);
      const prevActive =
        activePlaylist[(activeIdx - 1 + activePlaylist.length) % activePlaylist.length];
      const prevGlobalIdx = songs.findIndex((s) => s.id === prevActive.id);
      setCurrentIndex(prevGlobalIdx !== -1 ? prevGlobalIdx : 0);
    } else {
      setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
    }
    setCurrentTime(0);
    setIsPlaying(true);
  }, [songs, activePlaylist, currentSong]);

  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSelectSong = (song: Song) => {
    ambientSound.cleanupOnTrackChange();
    const idx = songs.findIndex((s) => s.id === song.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setCurrentTime(0);
      setIsPlaying(true);
    }
    setIsTapeRackOpen(false);
  };

  const handleSeek = (newTime: number) => {
    setSeekTarget(newTime);
    setCurrentTime(newTime);
    setTimeout(() => setSeekTarget(null), 100);
  };

  const handleTimeUpdate = useCallback((curr: number, dur: number) => {
    setCurrentTime(curr);
    if (dur > 0) setDuration(dur);
  }, []);

  // Ambient sound synthesizer toggles
  const handleToggleVinylCrackle = () => {
    if (vinylCrackle) {
      ambientSound.stopVinyl();
      setVinylCrackle(false);
    } else {
      ambientSound.startVinyl(0.35);
      setVinylCrackle(true);
    }
  };

  const handleToggleNightRain = () => {
    if (nightRain) {
      ambientSound.stopRain();
      setNightRain(false);
    } else {
      ambientSound.startRain(0.4);
      setNightRain(true);
    }
  };

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

    // Remove from category list
    setCategories((prev) => prev.filter((c) => c !== categoryToDelete));

    // Reset filter if currently viewing deleted category
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }

    // Update local state immediately
    if (action === 'reassign_to_all') {
      setSongs((prev) =>
        prev.map((s) => (s.category === categoryToDelete ? { ...s, category: 'All' } : s))
      );
      showToast(`Category "${categoryToDelete}" hata di gayi. ${affectedCount} gaane 'Sabhi Gaane' me chale gaye.`);
    } else {
      setSongs((prev) => prev.filter((s) => s.category !== categoryToDelete));
      showToast(`Category "${categoryToDelete}" aur ${affectedCount} gaane delete kar diye gaye.`);
    }

    // Re-sync with Supabase
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
    <div className="min-h-screen bg-[#000000] text-[#ffffff] relative flex flex-col justify-between selection:bg-[#5B0E14] selection:text-[#f1e194] overflow-hidden">
      {/* 1. Full-Screen Anime Italian Cafe Counter Entrance View Background with Ken Burns Slow Zoom */}
      <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
        <img
          src={cafeCounterBg}
          alt="Anime Italian Cafe Counter Entrance View"
          className="w-full h-full object-cover object-center animate-ken-burns scale-105"
        />
        {/* Subtle Dark Glassmorphism / Ambient Vignette Overlay in Deep Black #000000 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/80 via-[#000000]/65 to-[#000000]/85 backdrop-blur-[1px]" />

        {/* Breathing Oven Ember & Warm Glow: Radial lighting pulse expanding and contracting like breathing fire */}
        <div
          className="absolute top-[38%] right-[24%] w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full pointer-events-none animate-oven-breathe mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle, rgba(241, 225, 148, 0.45) 0%, rgba(91, 14, 20, 0.35) 40%, rgba(0, 0, 0, 0) 70%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* 2. Floating Golden Dust / Embers (#f1e194) & Falling Rain Streaks on Window */}
      <AnimeBackground nightRainActive={nightRain} />

      {/* 3. Subtle Film Grain */}
      <div className="fixed inset-0 grain-overlay z-20 pointer-events-none opacity-30" />

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

      {/* 5. Clean Top Bar Header with Supabase status & Night Rain Toggle */}
      <Header
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTapeRack={() => setIsTapeRackOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        nightRain={nightRain}
        onToggleNightRain={handleToggleNightRain}
        songCount={songs.length}
      />

      {/* 6. Main Stage: Clean, Unblocked Cafe View & Tactile Player Controls */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col justify-center items-center z-20 relative">
        {/* Clean Hero Title */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#ffffff] font-cinzel drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            HACKY PIZZA TOWN
          </h1>
          <p className="text-xs sm:text-sm text-[#f1e194] font-mono mt-1 tracking-wider drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            Garma-garam Pizza, Thandi Hawa aur Dilchasp Dhunein
          </p>

          {/* Supabase Status Pill Banner */}
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-[#000000]/80 border border-[#5B0E14] rounded-full text-[11px] font-mono backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#ffffff]">Database:</span>
            {isDbLoading ? (
              <span className="text-[#f1e194]">Sync ho raha hai...</span>
            ) : isDbConnected ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Database Connected ({songs.length} gaane · {categories.length} categories)</span>
              </span>
            ) : isTableMissing ? (
              <span className="text-[#f1e194] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[#f1e194]" />
                <span>Connected · Table pending</span>
              </span>
            ) : (
              <span className="text-emerald-300">Connected</span>
            )}
          </div>
        </div>

        {/* Interactive Cinematic Pizza Vinyl Turntable Player Stage */}
        <div className="w-full max-w-2xl mb-5">
          <TurntableVinyl
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={handlePlayPause}
          />
        </div>

        {/* Database Empty / Friendly Prompt */}
        {(isTableEmpty || isTableMissing) && (
          <div className="w-full max-w-xl mb-4 p-3 bg-[#000000]/85 border border-[#5B0E14] rounded-xl text-xs font-mono text-center backdrop-blur-md">
            <p className="text-[#f1e194] font-bold">
              {isTableEmpty
                ? 'Supabase table abhi khali hai · Sample lo-fi gaana chal raha hai'
                : 'Supabase se connect ho gaya · Pizzeria ka lo-fi track chal raha hai'}
            </p>
            <p className="text-[#ffffff]/70 text-[10px] mt-0.5">
              Naye gaane jodne ya categories manage karne ke liye kholein:{' '}
              <button
                onClick={() => setIsAdminOpen(true)}
                className="text-[#f1e194] underline hover:text-[#ffffff] font-bold"
              >
                Kitchen Counter ⚙️ (PIN: 1234)
              </button>
            </p>
          </div>
        )}

        {/* Dynamic Category Vibe Filter Pills with Custom Palette */}
        <div className="w-full max-w-2xl mb-5 flex items-center justify-center gap-2 overflow-x-auto pb-1 text-xs font-mono no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 border ${
              selectedCategory === 'All'
                ? 'bg-[#5B0E14] border-[#f1e194] text-[#ffffff] font-bold shadow-[0_0_14px_rgba(241,225,148,0.4)]'
                : 'bg-[#000000]/75 border-[#5B0E14]/60 text-[#ffffff]/80 hover:text-[#f1e194] hover:border-[#f1e194] backdrop-blur-xs'
            }`}
          >
            Sabhi Gaane ({songs.length})
          </button>
          {categories.map((cat) => {
            const count = songs.filter((s) => s.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-[#5B0E14] border-[#f1e194] text-[#ffffff] font-bold shadow-[0_0_14px_rgba(241,225,148,0.4)]'
                    : 'bg-[#000000]/75 border-[#5B0E14]/60 text-[#ffffff]/80 hover:text-[#f1e194] hover:border-[#f1e194] backdrop-blur-xs'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Centered Minimalist Player Controls on the Counter */}
        <div className="w-full max-w-2xl">
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
            onOpenTapeRack={() => setIsTapeRackOpen(true)}
            hasSongs={songs.length > 0}
          />
        </div>
      </main>

      {/* Clean Footer with Discreet Staff Admin Gear Link */}
      <footer className="border-t border-[#5B0E14]/40 bg-[#000000]/90 backdrop-blur-md py-3.5 px-6 z-20 text-[11px] font-mono text-[#ffffff]/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-cinzel text-[#ffffff] font-bold">Hacky Pizza Town</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#f1e194]">Cafe &amp; Lo-Fi Lounge</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>Database Connected</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdminOpen(true)}
            className="hover:text-[#f1e194] transition-colors flex items-center gap-1 text-[#ffffff]/70 hover:underline"
            title="Kitchen Staff Admin (PIN: 1234)"
          >
            <span>⚙️ Staff Admin (PIN: 1234)</span>
          </button>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-[#f1e194]">
            <Sparkles className="w-3 h-3 text-[#f1e194]" />
            <span>Stereo Hi-Fi</span>
          </span>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#000000]/95 border border-[#f1e194] text-[#f1e194] text-xs font-mono px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.95)] flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 max-w-md text-center">
          <span className="w-2 h-2 rounded-full bg-[#f1e194] animate-ping shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Drawers */}
      <TapeRackDrawer
        isOpen={isTapeRackOpen}
        onClose={() => setIsTapeRackOpen(false)}
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        onSelectSong={handleSelectSong}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(c) => setSelectedCategory(c)}
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
