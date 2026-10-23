import { useEffect, useState } from 'react';
import { Song } from '../types';

interface CassetteDeckProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onFlipSide?: () => void;
}

export default function CassetteDeck({
  currentSong,
  isPlaying,
  currentTime,
  duration,
}: CassetteDeckProps) {
  const [tapeSide, setTapeSide] = useState<'A' | 'B'>('A');
  const [counterOffset, setCounterOffset] = useState<number>(0);
  const [vuLevels, setVuLevels] = useState<{ left: number; right: number }>({ left: 12, right: 10 });

  // Tape counter based on current time + counter offset
  const rawCounter = Math.floor(currentTime + counterOffset);
  const formattedCounter = Math.abs(rawCounter % 1000).toString().padStart(3, '0');

  // Tape reel calculation (percentage 0 to 1)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  
  // Left spool shrinks as tape plays, Right spool expands
  // Full reel radius ~44px, empty hub ~22px
  const leftTapeRadius = Math.round(44 - progressRatio * 20);
  const rightTapeRadius = Math.round(22 + progressRatio * 20);

  // VU meter needle simulation while playing
  useEffect(() => {
    if (!isPlaying) {
      setVuLevels({ left: 8, right: 6 });
      return;
    }

    const interval = window.setInterval(() => {
      // Dynamic needle bounce with rhythmic jitter
      const base = 45 + Math.random() * 38;
      const leftJitter = Math.min(95, Math.max(15, base + (Math.random() * 14 - 7)));
      const rightJitter = Math.min(95, Math.max(15, base + (Math.random() * 14 - 7)));
      setVuLevels({ left: Math.round(leftJitter), right: Math.round(rightJitter) });
    }, 110);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleResetCounter = () => {
    setCounterOffset(-Math.floor(currentTime));
  };

  const toggleSide = () => {
    setTapeSide((prev) => (prev === 'A' ? 'B' : 'A'));
  };

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      {/* Top Deck Trim: Analog VU Meters & Tape Counter */}
      <div className="bg-[#240e06] border-t border-x border-[#502314] rounded-t-xl px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Tape Deck Status & Mechanical Counter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isPlaying
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-[#5c2415] opacity-60'
              }`}
            />
            <span className="text-[11px] font-mono tracking-widest text-amber-200/80 uppercase font-bold">
              {isPlaying ? 'RUNNING' : 'STOP'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#140602] border border-[#502314] px-3 py-1 rounded">
            <span className="text-[10px] text-amber-500/70 uppercase tracking-wider font-mono">TAPE</span>
            <span className="font-lcd text-2xl text-amber-400 font-bold leading-none w-10 text-center tracking-widest">
              {formattedCounter}
            </span>
            <button
              onClick={handleResetCounter}
              title="Reset Counter"
              className="text-[10px] uppercase font-mono text-[#a16207] hover:text-amber-300 px-1 hover:bg-[#38160b] rounded transition-colors"
            >
              RESET
            </button>
          </div>
        </div>

        {/* Center/Right: Dual Analog VU Meters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#150703] border border-[#481c0e] px-2.5 py-1.5 rounded-md shadow-inner">
            <span className="text-[9px] font-mono text-amber-600/90 font-bold">VU</span>
            
            {/* Left Channel Meter */}
            <div className="w-16 h-7 bg-[#fff8e7] rounded-sm relative overflow-hidden border border-[#502314]/80 flex flex-col justify-end p-0.5">
              <div className="absolute top-0.5 inset-x-0 flex justify-between px-1 text-[7px] text-[#502314] font-mono leading-none">
                <span>-20</span>
                <span>-7</span>
                <span>0</span>
                <span className="text-red-700 font-bold">+3</span>
              </div>
              <div
                className="w-0.5 h-6 bg-[#b91c1c] origin-bottom absolute bottom-0 left-1/2 transition-transform duration-100 shadow-sm"
                style={{
                  transform: `translateX(-50%) rotate(${-40 + (vuLevels.left / 100) * 80}deg)`,
                }}
              />
              <span className="text-[8px] font-bold text-[#502314]/70 pl-0.5 z-10 leading-none">L</span>
            </div>

            {/* Right Channel Meter */}
            <div className="w-16 h-7 bg-[#fff8e7] rounded-sm relative overflow-hidden border border-[#502314]/80 flex flex-col justify-end p-0.5">
              <div className="absolute top-0.5 inset-x-0 flex justify-between px-1 text-[7px] text-[#502314] font-mono leading-none">
                <span>-20</span>
                <span>-7</span>
                <span>0</span>
                <span className="text-red-700 font-bold">+3</span>
              </div>
              <div
                className="w-0.5 h-6 bg-[#b91c1c] origin-bottom absolute bottom-0 left-1/2 transition-transform duration-100 shadow-sm"
                style={{
                  transform: `translateX(-50%) rotate(${-40 + (vuLevels.right / 100) * 80}deg)`,
                }}
              />
              <span className="text-[8px] font-bold text-[#502314]/70 pl-0.5 z-10 leading-none">R</span>
            </div>
          </div>

          {/* Tape Side Toggle Button */}
          <button
            onClick={toggleSide}
            className="text-[11px] font-mono font-bold px-2 py-1 bg-[#3a150b] border border-[#6b2a16] hover:bg-[#502314] text-amber-200 rounded transition-colors active:translate-y-0.5 shadow"
            title="Flip Cassette Side"
          >
            SIDE {tapeSide}
          </button>
        </div>
      </div>

      {/* Main Cassette Shell */}
      <div className="relative bg-[#3b170c] border-2 border-[#682713] rounded-b-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.08)]">
        {/* Corner Screws */}
        <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-[#1e0a04] border border-[#783018] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#421b0f]" />
        </div>
        <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-[#1e0a04] border border-[#783018] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#421b0f] rotate-45" />
        </div>
        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-[#1e0a04] border border-[#783018] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#421b0f] -rotate-45" />
        </div>
        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-[#1e0a04] border border-[#783018] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#421b0f] rotate-90" />
        </div>

        {/* Vintage Cassette Face Sticker */}
        <div className="relative bg-[#fcf5e5] text-[#2c1208] rounded-lg p-4 border border-[#d6c59d] shadow-inner overflow-hidden">
          {/* Authentic retro header band */}
          <div className="flex items-center justify-between border-b-2 border-[#9c3d1b] pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#9c3d1b] text-[#fcf5e5] px-2 py-0.5 text-xs font-black tracking-wider uppercase font-mono rounded-sm">
                HACKY 90
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#662810] font-bold">
                SUPER FERRO-CHROME · TYPE I
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#9c3d1b]">
              <span>EQ 120µs</span>
              <span>·</span>
              <span className="text-sm font-black bg-[#2c1208] text-amber-300 px-1.5 py-0.5 rounded">
                SIDE {tapeSide}
              </span>
            </div>
          </div>

          {/* Current Song Title & Artist: Handwritten/Typewritten Aesthetic */}
          <div className="bg-[#fff9eb] border border-[#e4d3a8] rounded px-3 py-2 shadow-sm mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono text-[#8a3818] tracking-wider mb-0.5 font-bold">
                  Track Label
                </div>
                <div className="font-typewriter font-bold text-base text-[#1c0b05] truncate tracking-tight">
                  {currentSong ? currentSong.title : 'No Cassette Loaded'}
                </div>
                <div className="font-typewriter text-xs text-[#502314]/90 truncate">
                  {currentSong ? currentSong.artist : 'Select a track from the tape rack'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-[#78350f] block">
                  {currentSong?.category || 'Cafe Jukebox'}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#b45309]">
                  NR [ON]
                </span>
              </div>
            </div>
          </div>

          {/* Cassette Center Window & Spinning Reels */}
          <div className="relative bg-[#1a0802] rounded-lg border-2 border-[#542110] p-4 shadow-[inset_0_4px_16px_rgba(0,0,0,0.95)] flex items-center justify-between gap-4 overflow-hidden">
            {/* Warm incandescent ambient light glow inside the window */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-amber-600/10 to-amber-900/20 pointer-events-none" />

            {/* Left Spool (Feeder Reel) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                {/* Magnetic tape layer around the hub */}
                <div
                  className="rounded-full bg-[#3d180a] border border-[#230d05] shadow transition-all duration-300"
                  style={{
                    width: `${leftTapeRadius * 2}px`,
                    height: `${leftTapeRadius * 2}px`,
                  }}
                />

                {/* Center White Toothed Drive Gear */}
                <div
                  className={`absolute w-12 h-12 rounded-full bg-[#fdfbf7] border-2 border-[#d4cebd] flex items-center justify-center shadow-md ${
                    isPlaying ? 'animate-spin-reel' : ''
                  }`}
                >
                  {/* Gear teeth spokes */}
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute" />
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute rotate-60" />
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute -rotate-60" />
                  
                  {/* Center Spindle Hole */}
                  <div className="w-6 h-6 rounded-full bg-[#1a0802] border-2 border-[#2c1208] z-10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#38160b]" />
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-amber-500/60 mt-1.5 font-bold">SUPPLY</span>
            </div>

            {/* Center Measurement Marks & Tape Ribbon */}
            <div className="flex-1 flex flex-col items-center justify-center relative px-2">
              {/* Tape horizontal bridge connecting the two hubs */}
              <div className="w-full h-2 bg-[#2d1207] border-y border-[#481b0a] mb-2 relative">
                <div
                  className="h-full bg-amber-500/30 transition-all duration-300"
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>

              {/* Tape measurement marks (100, 50, 0) */}
              <div className="flex items-center justify-between w-full text-[9px] font-mono text-amber-300/60 px-2">
                <span>100</span>
                <span>· 50 ·</span>
                <span>0</span>
              </div>

              {/* Tape window center notch & screw */}
              <div className="w-8 h-3 bg-[#0d0401] rounded border border-[#40170a] mt-1 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#2a1007]" />
              </div>
            </div>

            {/* Right Spool (Take-up Reel) */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                {/* Magnetic tape layer around the hub */}
                <div
                  className="rounded-full bg-[#3d180a] border border-[#230d05] shadow transition-all duration-300"
                  style={{
                    width: `${rightTapeRadius * 2}px`,
                    height: `${rightTapeRadius * 2}px`,
                  }}
                />

                {/* Center White Toothed Drive Gear */}
                <div
                  className={`absolute w-12 h-12 rounded-full bg-[#fdfbf7] border-2 border-[#d4cebd] flex items-center justify-center shadow-md ${
                    isPlaying ? 'animate-spin-reel' : ''
                  }`}
                >
                  {/* Gear teeth spokes */}
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute" />
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute rotate-60" />
                  <div className="w-1.5 h-11 bg-[#7d7565] absolute -rotate-60" />

                  {/* Center Spindle Hole */}
                  <div className="w-6 h-6 rounded-full bg-[#1a0802] border-2 border-[#2c1208] z-10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#38160b]" />
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-mono text-amber-500/60 mt-1.5 font-bold">TAKE-UP</span>
            </div>
          </div>

          {/* Lower Guide Strip */}
          <div className="mt-3 pt-2 border-t border-[#e2d0a4] flex items-center justify-between text-[10px] font-mono text-[#662810]">
            <span>HACKY PIZZA TOWN · CAFE STEREO CASSETTE</span>
            <span className="font-bold text-[#9c3d1b]">MADE IN MUMBAI · 1994</span>
          </div>
        </div>

        {/* Lower Magnetic Tape Head Guide Bay (Cutouts for tape heads and pinch rollers) */}
        <div className="mt-3 bg-[#1d0903] border border-[#481a0b] rounded px-4 py-2 flex items-center justify-between">
          <div className="w-5 h-5 rounded-full bg-[#0e0401] border border-[#3b1509] flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#522110]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-3 bg-[#692914] rounded-sm border border-[#913b1f]" title="Record Head" />
            <div className="w-6 h-4 bg-[#b45309] rounded-sm border border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.4)] flex items-center justify-center text-[7px] font-mono text-[#1d0903] font-bold">
              PLAY
            </div>
            <div className="w-4 h-3 bg-[#692914] rounded-sm border border-[#913b1f]" title="Erase Head" />
          </div>
          <div className="w-5 h-5 rounded-full bg-[#0e0401] border border-[#3b1509] flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#522110]" />
          </div>
        </div>
      </div>
    </div>
  );
}
