import { useEffect, useState } from 'react';
import { Song } from '../types';
import { Disc3, Radio } from 'lucide-react';

interface TurntableVinylProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export default function TurntableVinyl({
  currentSong,
  isPlaying,
  currentTime,
  duration,
}: TurntableVinylProps) {
  // 16 equalizer frequency bands
  const [eqHeights, setEqHeights] = useState<number[]>(() =>
    Array.from({ length: 16 }, () => 15)
  );

  // Equalizer animation effect
  useEffect(() => {
    if (!isPlaying) {
      setEqHeights(Array.from({ length: 16 }, () => 8));
      return;
    }

    const interval = setInterval(() => {
      setEqHeights(
        Array.from({ length: 16 }, (_, i) => {
          // Dynamic rhythm curve with bass on left, mids center, treble right
          const centerBias = Math.sin((i / 16) * Math.PI);
          const base = 25 + centerBias * 45;
          const jitter = Math.random() * 32;
          return Math.min(100, Math.max(12, Math.round(base + jitter)));
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Tonearm angle calculation:
  // Rest position = 0deg (off record)
  // Playing position = 22deg (on outer groove) up to 29deg (towards inner label as track progresses)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const tonearmAngle = isPlaying ? 22 + progressRatio * 7 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      {/* Top Deck Banner: Glowing Live Oven Badge */}
      <div className="bg-[#101726] border-t border-x border-[#1e293b] rounded-t-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Live Badge */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
          </span>
          <span className="text-[11px] md:text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            FORNO A LEGNA ACCESO (Wood-Fired Oven Active) | RADIO ON AIR
          </span>
        </div>

        {/* 33 RPM Speed Light Indicator */}
        <div className="flex items-center gap-2 bg-[#0a0f18] px-3 py-1 rounded-md border border-[#1e293b]">
          <span className="text-[10px] font-mono text-amber-500/80">SPEED</span>
          <span className="text-xs font-mono font-bold text-amber-400">33⅓ RPM</span>
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isPlaying ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
            }`}
          />
        </div>
      </div>

      {/* Main Turntable Chassis */}
      <div className="relative bg-[#131b2b] border-2 border-[#24334d] rounded-b-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.06)] overflow-hidden">
        {/* Subtle Brushed Metal Accent Screws at 4 corners */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#475569]" />
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#475569] rotate-45" />
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#475569] -rotate-45" />
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center">
          <div className="w-2 h-0.5 bg-[#475569] rotate-90" />
        </div>

        {/* Deck Layout: Platter on Left, Tonearm on Right */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          {/* Turntable Platter & Vinyl Record */}
          <div className="relative flex items-center justify-center p-3">
            {/* Turntable Platter Base (Strobe Edge with Silver Rim) */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#0a0f18] p-2 shadow-[0_12px_32px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(0,0,0,0.9)] border-4 border-[#24334d] flex items-center justify-center">
              {/* Outer Strobe Dots Ring */}
              <div className="absolute inset-1 rounded-full border border-dashed border-slate-600/30 pointer-events-none" />

              {/* The Vinyl Record */}
              <div
                className={`relative w-full h-full rounded-full bg-[#090b10] border-2 border-[#1a202c] shadow-[0_0_24px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden ${
                  isPlaying ? 'animate-vinyl-spin' : ''
                }`}
              >
                {/* Micro Grooves (Concentric Circles) */}
                <div className="absolute inset-3 rounded-full border border-slate-800/60" />
                <div className="absolute inset-6 rounded-full border border-slate-800/80" />
                <div className="absolute inset-9 rounded-full border border-slate-800/70" />
                <div className="absolute inset-12 rounded-full border border-slate-800/90" />
                <div className="absolute inset-16 rounded-full border border-slate-800/80" />
                <div className="absolute inset-20 rounded-full border border-slate-800/90" />
                <div className="absolute inset-24 rounded-full border border-slate-800/70" />

                {/* Anisotropic Light Sheen (Two semi-transparent wedge highlights) */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background:
                      'conic-gradient(from 45deg, transparent 0deg, rgba(255,255,255,0.4) 35deg, transparent 70deg, transparent 180deg, rgba(255,255,255,0.4) 215deg, transparent 250deg)',
                  }}
                />

                {/* Custom "Hacky Pizza Town" Center Record Label */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#c2410c] via-[#b45309] to-[#9a3412] p-1.5 shadow-[0_0_12px_rgba(0,0,0,0.8)] border-2 border-amber-300 flex flex-col items-center justify-center text-center">
                  {/* Outer Label Ring */}
                  <div className="w-full h-full rounded-full border border-amber-200/50 flex flex-col items-center justify-center p-2 text-[#fef3c7]">
                    <div className="text-[8px] font-cinzel font-black tracking-widest uppercase leading-tight">
                      HACKY PIZZA
                    </div>
                    <div className="text-[6px] font-mono tracking-widest text-amber-200 uppercase">
                      TRATTORIA LO-FI
                    </div>

                    {/* Center Spindle Hole */}
                    <div className="w-5 h-5 rounded-full bg-[#0a0f18] border-2 border-slate-300 my-1 flex items-center justify-center shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#fef3c7]" />
                    </div>

                    <div className="text-[7px] font-mono font-bold text-amber-100 truncate max-w-[85px] leading-tight">
                      {currentSong ? currentSong.title : 'No Vinyl Loaded'}
                    </div>
                    <div className="text-[6px] font-mono text-amber-300/80 uppercase">
                      SIDE 1 · 33⅓ RPM
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Turntable Power Switch at lower left */}
            <div className="absolute bottom-1 left-2 flex items-center gap-1.5 bg-[#0a0f18] px-2.5 py-1 rounded-md border border-[#1e293b]">
              <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">DRIVE</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 shadow-[0_0_6px_#22c55e]' : 'bg-red-950 border border-red-800'
                }`}
              />
            </div>
          </div>

          {/* Right Section: Tonearm Assembly & Glowing EQ Waveform */}
          <div className="flex-1 w-full flex flex-col justify-between items-center md:items-end min-h-[280px]">
            {/* Mechanical Tonearm Assembly */}
            <div className="relative w-44 h-48 mb-2 hidden sm:block">
              {/* Tonearm Pivot Base (Gimbal and Counterweight) */}
              <div className="absolute top-2 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#475569] to-[#0f172a] border-2 border-[#64748b] shadow-xl flex items-center justify-center z-20">
                {/* Silver Pivot Screw */}
                <div className="w-5 h-5 rounded-full bg-[#94a3b8] border border-white flex items-center justify-center shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1e293b]" />
                </div>
                {/* Heavy Counterweight Ring */}
                <div className="absolute -top-3 w-8 h-4 rounded-sm bg-[#334155] border border-[#64748b] shadow" />
              </div>

              {/* Tonearm Arm Rest Post */}
              <div className="absolute top-24 right-9 w-3 h-5 bg-[#334155] border border-[#64748b] rounded-t-sm z-10 flex items-center justify-center">
                <div className="w-1 h-2 bg-[#64748b]" />
              </div>

              {/* Rotating Tonearm Wand with Stylus Needle */}
              <div
                className="absolute top-8 right-10 origin-top-right transition-transform duration-700 ease-in-out z-30"
                style={{
                  transform: `rotate(${tonearmAngle}deg)`,
                }}
              >
                {/* S-Shaped Curved Chrome Tonearm Tube */}
                <div className="w-1.5 h-36 bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] rounded-full shadow-md ml-auto" />

                {/* Stylus Cartridge & Headshell at the tip */}
                <div className="relative -ml-3 -mt-1 w-7 h-5 bg-[#c2410c] border border-amber-400 rounded-sm shadow-md flex items-center justify-center">
                  <span className="text-[6px] font-mono font-bold text-amber-100">AUDIO</span>
                  {/* Glowing Needle Tip */}
                  <div
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isPlaying
                        ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Glowing Audio Equalizer Waveform Bars */}
            <div className="w-full bg-[#0a0f18] border border-[#1e293b] rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/80 mb-2">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>SPECTRUM ANALYZER</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {isPlaying ? 'ACTIVE · 44.1 kHz' : 'STANDBY'}
                </span>
              </div>

              {/* 16 Equalizer Bars with Cheese-Amber to Basil-Green LED segments */}
              <div className="flex items-end justify-between gap-1 h-14 px-1">
                {eqHeights.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-xs transition-all duration-100"
                      style={{
                        height: `${val}%`,
                        background:
                          val > 75
                            ? 'linear-gradient(to top, #c2410c, #f59e0b, #16a34a)'
                            : val > 45
                            ? 'linear-gradient(to top, #c2410c, #f59e0b)'
                            : 'linear-gradient(to top, #7c2d12, #c2410c)',
                        boxShadow: isPlaying ? '0 0 6px rgba(245, 158, 11, 0.4)' : 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Deck Status Kicker */}
            <div className="w-full mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-amber-500" />
                <span>DIRECT DRIVE HI-FI</span>
              </span>
              <span className="text-amber-300 font-bold">
                {isPlaying ? 'STYLUS ENGAGED' : 'STYLUS PARKED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
