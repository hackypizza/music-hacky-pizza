import { useEffect, useState, useRef } from 'react';
import { Song } from '../types';
import { Disc3, Radio, Flame, Sparkles, Volume2 } from 'lucide-react';

interface TurntableVinylProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause?: () => void;
}

export default function TurntableVinyl({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
}: TurntableVinylProps) {
  // 16 equalizer frequency bands
  const [eqHeights, setEqHeights] = useState<number[]>(() =>
    Array.from({ length: 16 }, () => 14)
  );

  // Track topping bounce drop animation key
  const [toppingDropKey, setToppingDropKey] = useState<number>(0);
  const prevIsPlayingRef = useRef<boolean>(isPlaying);
  const prevSongIdRef = useRef<string | undefined>(currentSong?.id);

  // Trigger topping bounce drop whenever track starts playing or changes
  useEffect(() => {
    const becamePlaying = !prevIsPlayingRef.current && isPlaying;
    const songChanged = prevSongIdRef.current !== currentSong?.id;

    if ((becamePlaying || songChanged) && isPlaying) {
      setToppingDropKey((k) => k + 1);
    }

    prevIsPlayingRef.current = isPlaying;
    prevSongIdRef.current = currentSong?.id;
  }, [isPlaying, currentSong?.id]);

  // Smooth continuous rotation with physics-based deceleration on pause/stop
  const currentRotationRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);
  const pizzaDiscRef = useRef<HTMLDivElement>(null);

  // Target rotational speed: 360 deg in 12s = 30 deg/sec = ~0.5 deg per frame at 60fps
  const TARGET_ROTATION_SPEED = 0.5;

  useEffect(() => {
    let lastTime = performance.now();
    let animationFrameId: number;

    const animateSpin = (now: number) => {
      const delta = Math.min(50, now - lastTime) / 16.667;
      lastTime = now;

      if (isPlaying) {
        // Smoothly accelerate up to the target 12s spin rate
        angularVelocityRef.current +=
          (TARGET_ROTATION_SPEED - angularVelocityRef.current) * 0.08 * delta;
      } else {
        // Smoothly decelerate to a halt (gradual ease-out over ~800ms)
        angularVelocityRef.current *= Math.pow(0.94, delta);
        if (angularVelocityRef.current < 0.005) {
          angularVelocityRef.current = 0;
        }
      }

      if (angularVelocityRef.current > 0.0001) {
        currentRotationRef.current =
          (currentRotationRef.current + angularVelocityRef.current * delta) % 360;
        if (pizzaDiscRef.current) {
          pizzaDiscRef.current.style.transform = `rotate(${currentRotationRef.current}deg) translateZ(0)`;
        }
      }

      animationFrameId = requestAnimationFrame(animateSpin);
    };

    animationFrameId = requestAnimationFrame(animateSpin);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Dynamic Audio Spectrum Equalizer Bars
  useEffect(() => {
    if (!isPlaying) {
      setEqHeights(Array.from({ length: 16 }, () => 8));
      return;
    }

    const interval = setInterval(() => {
      setEqHeights(
        Array.from({ length: 16 }, (_, i) => {
          const centerBias = Math.sin((i / 16) * Math.PI);
          const base = 25 + centerBias * 45;
          const jitter = Math.random() * 32;
          return Math.min(100, Math.max(12, Math.round(base + jitter)));
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Tonearm tracking calculation:
  // Rest angle = 0deg (off record)
  // Playing angle = 22deg (outer crust rim) to 29deg (near center label)
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const tonearmAngle = isPlaying ? 22 + progressRatio * 7 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      {/* Top Deck Banner: Wood-Fired Oven & Live Jukebox Status */}
      <div className="bg-[#000000]/90 border-t-2 border-x-2 border-[#5B0E14] rounded-t-2xl px-4 sm:px-5 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        {/* Live Oven Indicator */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPlaying ? 'animate-ping bg-[#f1e194]' : 'bg-[#5B0E14]'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isPlaying
                  ? 'bg-[#f1e194] shadow-[0_0_10px_#f1e194]'
                  : 'bg-[#5B0E14] border border-[#f1e194]/40'
              }`}
            />
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-[#f1e194] uppercase flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#f1e194]" />
            <span>KITCHEN COUNTER / LIVE JUKEBOX</span>
          </span>
        </div>

        {/* 33 RPM Speed Light Indicator */}
        <div className="flex items-center gap-2 bg-[#000000] px-3 py-1 rounded-md border border-[#5B0E14]/80">
          <span className="text-[9px] sm:text-[10px] font-mono text-[#ffffff]/70">SPEED</span>
          <span className="text-xs font-mono font-bold text-[#f1e194]">33⅓ RPM</span>
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isPlaying ? 'bg-[#f1e194] shadow-[0_0_8px_#f1e194]' : 'bg-[#5B0E14]'
            }`}
          />
        </div>
      </div>

      {/* Main Turntable Chassis */}
      <div className="relative bg-[#000000]/95 border-2 border-[#5B0E14] rounded-b-2xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(91,14,20,0.4)] backdrop-blur-lg overflow-hidden">
        {/* Brass Vintage Screws at 4 corners */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#1c0507] border border-[#5B0E14] flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-[#f1e194]/60" />
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#1c0507] border border-[#5B0E14] flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-[#f1e194]/60 rotate-45" />
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#1c0507] border border-[#5B0E14] flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-[#f1e194]/60 -rotate-45" />
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#1c0507] border border-[#5B0E14] flex items-center justify-center shadow">
          <div className="w-2 h-0.5 bg-[#f1e194]/60 rotate-90" />
        </div>

        {/* Deck Layout: Pizza Vinyl Platter on Left, Tonearm & Spectrum on Right */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          {/* ========================================================
              PIZZA VINYL PLATTER CONTAINER
             ======================================================== */}
          <div className="relative flex flex-col items-center justify-center p-2">
            {/* Hot Fresh Rising Steam Clouds Layer (Active when playing) */}
            <div
              className={`absolute -top-12 sm:-top-16 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-28 pointer-events-none z-30 transition-opacity duration-700 ${
                isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Plume 1 (Warm Cream Vapor) */}
              <svg
                className="absolute bottom-0 left-6 sm:left-12 w-10 sm:w-14 h-24 text-[#f1e194]/60 animate-pizza-steam-1 mix-blend-screen filter blur-[0.6px]"
                viewBox="0 0 32 75"
                fill="none"
              >
                <path
                  d="M16 75 C8 58 24 45 12 28 C4 16 20 8 14 0"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              {/* Plume 2 (Pure White Rising Smoke Cloud) */}
              <svg
                className="absolute bottom-0 left-20 sm:left-28 w-12 sm:w-16 h-28 text-[#ffffff]/65 animate-pizza-steam-2 mix-blend-screen filter blur-[0.8px]"
                viewBox="0 0 36 85"
                fill="none"
              >
                <path
                  d="M18 85 C28 66 10 50 24 32 C34 18 16 10 26 0"
                  stroke="currentColor"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Plume 3 (Golden Ember Vapor) */}
              <svg
                className="absolute bottom-0 right-6 sm:right-14 w-10 sm:w-12 h-22 text-[#f1e194]/50 animate-pizza-steam-3 mix-blend-screen filter blur-[0.6px]"
                viewBox="0 0 30 70"
                fill="none"
              >
                <path
                  d="M15 70 C7 52 20 40 10 24 C4 12 18 6 12 0"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Turntable Platter Base with Oven-Glow / Ember Aura */}
            <div
              className={`relative w-[clamp(240px,70vw,330px)] h-[clamp(240px,70vw,330px)] rounded-full bg-[#050203] p-2.5 border-4 border-[#5B0E14] shadow-[0_15px_40px_rgba(0,0,0,0.95)] flex items-center justify-center transition-all duration-700 ${
                isPlaying ? 'animate-pizza-ember' : 'animate-pizza-idle'
              }`}
            >
              {/* Outer Platter Strobe Rim with Stippled Brass Notches */}
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-[#f1e194]/30 pointer-events-none" />

              {/* 
                THE WOOD-FIRED PIZZA VINYL DISC 
                Click to play/pause with tactile hover cursor 
              */}
              <div
                ref={pizzaDiscRef}
                onClick={onPlayPause}
                title={isPlaying ? 'Gaana Roko' : 'Play Karein'}
                style={{ willChange: 'transform' }}
                className="relative w-full h-full rounded-full cursor-pointer overflow-hidden shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] group"
              >
                {/* 1. Artisanal Wood-Fired Crust Base (Golden-amber rim with charred blistering) */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Crust Outer Gradient */}
                    <radialGradient id="crustGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="68%" stopColor="#78350f" />
                      <stop offset="82%" stopColor="#b45309" />
                      <stop offset="92%" stopColor="#d97706" />
                      <stop offset="98%" stopColor="#5B0E14" />
                      <stop offset="100%" stopColor="#1c0507" />
                    </radialGradient>

                    {/* Rich San Marzano Marinara Base */}
                    <radialGradient id="sauceGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#991b1b" />
                      <stop offset="65%" stopColor="#b91c1c" />
                      <stop offset="85%" stopColor="#7f1d1d" />
                      <stop offset="100%" stopColor="#5B0E14" />
                    </radialGradient>

                    {/* Melted Fior Di Latte Mozzarella Swirl */}
                    <radialGradient id="cheeseGradient" cx="45%" cy="45%" r="55%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="40%" stopColor="#fef08a" />
                      <stop offset="80%" stopColor="#f1e194" />
                      <stop offset="100%" stopColor="#d6c374" />
                    </radialGradient>
                  </defs>

                  {/* Crust Base Circle */}
                  <circle cx="100" cy="100" r="98" fill="url(#crustGradient)" />

                  {/* Charred Leoparding Blister Marks on Crust Rim */}
                  <circle cx="28" cy="45" r="4.5" fill="#1c0507" />
                  <circle cx="34" cy="41" r="2.5" fill="#3b0a0e" />
                  <circle cx="72" cy="14" r="5" fill="#1c0507" />
                  <circle cx="125" cy="12" r="4" fill="#240407" />
                  <circle cx="168" cy="42" r="5.5" fill="#1c0507" />
                  <circle cx="188" cy="85" r="4" fill="#3b0a0e" />
                  <circle cx="178" cy="142" r="5" fill="#1c0507" />
                  <circle cx="138" cy="184" r="4.5" fill="#240407" />
                  <circle cx="75" cy="186" r="4" fill="#1c0507" />
                  <circle cx="24" cy="148" r="5" fill="#3b0a0e" />
                  <circle cx="12" cy="102" r="4.5" fill="#1c0507" />

                  {/* 2. San Marzano Tomato Sauce Layer */}
                  <circle cx="100" cy="100" r="82" fill="url(#sauceGradient)" />

                  {/* 3. Melted Gooey Mozzarella Pools in Warm Cream #f1e194 */}
                  <path
                    d="M52 74 C58 54 84 50 115 56 C145 62 158 84 148 114 C138 144 112 152 78 144 C44 136 46 94 52 74 Z"
                    fill="url(#cheeseGradient)"
                    fillOpacity="0.88"
                  />
                  <ellipse cx="68" cy="118" rx="24" ry="16" fill="url(#cheeseGradient)" fillOpacity="0.82" />
                  <ellipse cx="132" cy="82" rx="22" ry="18" fill="url(#cheeseGradient)" fillOpacity="0.85" />
                  <ellipse cx="104" cy="134" rx="26" ry="14" fill="url(#cheeseGradient)" fillOpacity="0.88" />

                  {/* Molten Cheese Highlights & Bubbles */}
                  <circle cx="72" cy="84" r="3" fill="#ffffff" fillOpacity="0.9" />
                  <circle cx="128" cy="116" r="3.5" fill="#ffffff" fillOpacity="0.9" />
                  <circle cx="94" cy="62" r="2.5" fill="#ffffff" fillOpacity="0.8" />
                  <circle cx="138" cy="74" r="2.5" fill="#ffffff" fillOpacity="0.8" />

                  {/* 4. Concentric Vinyl Grooves Etched Across Pizza Disc */}
                  <circle cx="100" cy="100" r="92" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.35" />
                  <circle cx="100" cy="100" r="86" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.25" />
                  <circle cx="100" cy="100" r="80" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.3" />
                  <circle cx="100" cy="100" r="74" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.2" />
                  <circle cx="100" cy="100" r="68" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.25" />
                  <circle cx="100" cy="100" r="62" stroke="#ffffff" strokeWidth="0.6" strokeOpacity="0.22" />
                  <circle cx="100" cy="100" r="56" stroke="#000000" strokeWidth="0.8" strokeOpacity="0.25" />
                  <circle cx="100" cy="100" r="48" stroke="#000000" strokeWidth="0.7" strokeOpacity="0.3" />

                  {/* Anisotropic Light Sheen Sheer Wedges */}
                  <path
                    d="M100 100 L40 15 A98 98 0 0 1 160 15 Z"
                    fill="#ffffff"
                    fillOpacity="0.08"
                    pointerEvents="none"
                  />
                  <path
                    d="M100 100 L160 185 A98 98 0 0 1 40 185 Z"
                    fill="#ffffff"
                    fillOpacity="0.08"
                    pointerEvents="none"
                  />

                  {/* ========================================================
                      DYNAMIC TOPPINGS (Drop & Bounce In Animation)
                     ======================================================== */}
                  <g key={toppingDropKey}>
                    {/* Pepperoni Medallion 1 (Top Left) */}
                    <g className="topping-drop-1" transform="translate(62, 54)">
                      <circle cx="0" cy="0" r="13" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
                      <circle cx="-3" cy="-2" r="2" fill="#ef4444" fillOpacity="0.7" />
                      <circle cx="4" cy="3" r="1.5" fill="#450a0a" />
                      <circle cx="1" cy="-4" r="1" fill="#450a0a" />
                      <circle cx="-5" cy="4" r="1.2" fill="#f87171" fillOpacity="0.6" />
                    </g>

                    {/* Pepperoni Medallion 2 (Top Right) */}
                    <g className="topping-drop-2" transform="translate(138, 62)">
                      <circle cx="0" cy="0" r="13.5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
                      <circle cx="3" cy="-3" r="2" fill="#ef4444" fillOpacity="0.7" />
                      <circle cx="-4" cy="2" r="1.5" fill="#450a0a" />
                      <circle cx="2" cy="4" r="1.2" fill="#450a0a" />
                      <circle cx="-2" cy="-4" r="1" fill="#f87171" fillOpacity="0.6" />
                    </g>

                    {/* Pepperoni Medallion 3 (Bottom Right) */}
                    <g className="topping-drop-3" transform="translate(136, 136)">
                      <circle cx="0" cy="0" r="14" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
                      <circle cx="-2" cy="-3" r="2.2" fill="#ef4444" fillOpacity="0.7" />
                      <circle cx="4" cy="2" r="1.5" fill="#450a0a" />
                      <circle cx="-3" cy="4" r="1" fill="#450a0a" />
                      <circle cx="3" cy="-4" r="1.2" fill="#f87171" fillOpacity="0.6" />
                    </g>

                    {/* Pepperoni Medallion 4 (Bottom Left) */}
                    <g className="topping-drop-4" transform="translate(62, 138)">
                      <circle cx="0" cy="0" r="13" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
                      <circle cx="2" cy="-2" r="2" fill="#ef4444" fillOpacity="0.7" />
                      <circle cx="-3" cy="3" r="1.5" fill="#450a0a" />
                      <circle cx="4" cy="4" r="1.2" fill="#450a0a" />
                    </g>

                    {/* Fresh Garden Basil Leaf 1 */}
                    <g className="topping-drop-2" transform="translate(98, 42) rotate(-18)">
                      <path
                        d="M0 0 C8 -8 20 -6 22 8 C14 16 4 12 0 0 Z"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="1"
                      />
                      <path d="M3 2 L17 6" stroke="#86efac" strokeWidth="0.8" />
                    </g>

                    {/* Fresh Garden Basil Leaf 2 */}
                    <g className="topping-drop-5" transform="translate(148, 102) rotate(48)">
                      <path
                        d="M0 0 C7 -7 18 -5 20 7 C13 14 3 10 0 0 Z"
                        fill="#166534"
                        stroke="#14532d"
                        strokeWidth="1"
                      />
                      <path d="M2 2 L15 5" stroke="#86efac" strokeWidth="0.7" />
                    </g>

                    {/* Fresh Garden Basil Leaf 3 */}
                    <g className="topping-drop-6" transform="translate(54, 98) rotate(-42)">
                      <path
                        d="M0 0 C7 -7 17 -5 19 6 C12 13 3 9 0 0 Z"
                        fill="#15803d"
                        stroke="#14532d"
                        strokeWidth="1"
                      />
                      <path d="M2 1 L14 4" stroke="#86efac" strokeWidth="0.7" />
                    </g>

                    {/* Black Olive Ring 1 */}
                    <g className="topping-drop-3" transform="translate(100, 154)">
                      <circle cx="0" cy="0" r="6" fill="#18181b" stroke="#09090b" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="2.5" fill="#b91c1c" />
                    </g>

                    {/* Black Olive Ring 2 */}
                    <g className="topping-drop-4" transform="translate(146, 78)">
                      <circle cx="0" cy="0" r="5.5" fill="#18181b" stroke="#09090b" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="2.2" fill="#f1e194" />
                    </g>

                    {/* Black Olive Ring 3 */}
                    <g className="topping-drop-5" transform="translate(56, 76)">
                      <circle cx="0" cy="0" r="5.5" fill="#18181b" stroke="#09090b" strokeWidth="1.5" />
                      <circle cx="0" cy="0" r="2.2" fill="#991b1b" />
                    </g>
                  </g>
                </svg>

                {/* ========================================================
                    CENTER TURNTABLE SPINDLE & VINYL LABEL
                   ======================================================== */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#5B0E14] via-[#78131a] to-[#3b0a0e] p-1 border-2 border-[#f1e194] shadow-[0_0_18px_rgba(0,0,0,0.95)] flex flex-col items-center justify-center text-center">
                    <div className="w-full h-full rounded-full border border-[#f1e194]/40 flex flex-col items-center justify-center p-1.5 text-[#f1e194]">
                      {/* Top Label Brand */}
                      <div className="text-[7px] sm:text-[8px] font-cinzel font-black tracking-widest uppercase leading-none text-[#ffffff]">
                        HACKY PIZZA
                      </div>
                      <div className="text-[5px] sm:text-[6px] font-mono tracking-widest text-[#f1e194] uppercase leading-tight mt-0.5">
                        JUKEBOX HI-FI
                      </div>

                      {/* Center Brass Spindle Hole */}
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#000000] border-2 border-[#f1e194] my-1 flex items-center justify-center shadow-inner">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f1e194] shadow" />
                      </div>

                      {/* Currently Playing Track Hint */}
                      <div className="text-[6px] sm:text-[7px] font-mono font-bold text-[#ffffff] truncate max-w-[70px] sm:max-w-[85px] leading-tight">
                        {currentSong ? currentSong.title : 'No Vinyl Loaded'}
                      </div>
                      <div className="text-[5px] sm:text-[6px] font-mono text-[#f1e194]/80 uppercase leading-none mt-0.5">
                        33⅓ RPM · STEREO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Turntable Power Switch at Lower Left */}
            <div className="w-full mt-3 flex items-center justify-between px-2 text-[10px] font-mono">
              <div className="flex items-center gap-1.5 bg-[#000000] px-2.5 py-1 rounded-md border border-[#5B0E14]">
                <span className="text-[#ffffff]/70 uppercase font-bold">DRIVE:</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#5B0E14]'
                  }`}
                />
                <span className="text-[#f1e194] font-bold">
                  {isPlaying ? 'ROTATING (12s)' : 'STATIONARY'}
                </span>
              </div>

              {/* Click-to-Play hint */}
              <span className="text-[9px] text-[#ffffff]/60 hidden sm:inline-block">
                (Pizza pe click karke Play/Pause karein)
              </span>
            </div>
          </div>

          {/* ========================================================
              RIGHT SECTION: MECHANICAL TONEARM & AUDIO EQUALIZER
             ======================================================== */}
          <div className="flex-1 w-full flex flex-col justify-between items-center md:items-end min-h-[260px]">
            {/* Mechanical Chrome Tonearm Assembly */}
            <div className="relative w-44 h-44 mb-2 hidden md:block">
              {/* Tonearm Pivot Gimbal and Counterweight in #5B0E14 & Brass */}
              <div className="absolute top-2 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[#5B0E14] to-[#1c0507] border-2 border-[#f1e194] shadow-xl flex items-center justify-center z-20">
                {/* Brass Center Pivot Screw */}
                <div className="w-5 h-5 rounded-full bg-[#f1e194] border border-[#ffffff] flex items-center justify-center shadow">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#000000]" />
                </div>
                {/* Heavy Counterweight Ring */}
                <div className="absolute -top-3 w-8 h-4 rounded-xs bg-[#240407] border border-[#f1e194]/60 shadow" />
              </div>

              {/* Tonearm Arm Rest Post */}
              <div className="absolute top-24 right-9 w-3 h-5 bg-[#1c0507] border border-[#5B0E14] rounded-t-xs z-10 flex items-center justify-center">
                <div className="w-1 h-2 bg-[#f1e194]/70" />
              </div>

              {/* Rotating Tonearm Wand with Stylus Needle */}
              <div
                className="absolute top-8 right-10 origin-top-right transition-transform duration-700 ease-in-out z-30"
                style={{
                  transform: `rotate(${tonearmAngle}deg)`,
                }}
              >
                {/* S-Shaped Curved Chrome Tonearm Tube */}
                <div className="w-1.5 h-34 bg-gradient-to-b from-[#ffffff] via-[#f1e194] to-[#cbd5e1] rounded-full shadow-md ml-auto" />

                {/* Stylus Cartridge & Headshell at Tip in Deep Wine #5B0E14 */}
                <div className="relative -ml-3.5 -mt-1 w-8 h-5 bg-[#5B0E14] border border-[#f1e194] rounded-xs shadow-md flex items-center justify-center">
                  <span className="text-[6px] font-mono font-bold text-[#ffffff]">HI-FI</span>
                  {/* Glowing Needle Tip */}
                  <div
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      isPlaying
                        ? 'bg-[#f1e194] shadow-[0_0_10px_#f1e194]'
                        : 'bg-[#5B0E14] border border-[#f1e194]/50'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Glowing Audio Spectrum Equalizer Waveform Bars */}
            <div className="w-full bg-[#000000] border border-[#5B0E14] rounded-xl p-3.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#f1e194] mb-2">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#f1e194]" />
                  <span>SPECTRUM ANALYZER</span>
                </span>
                <span className="font-bold flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span className={isPlaying ? 'text-emerald-400' : 'text-[#ffffff]/60'}>
                    {isPlaying ? 'ACTIVE · 44.1 kHz' : 'STANDBY'}
                  </span>
                </span>
              </div>

              {/* 16 Equalizer Bars with Wine-To-Cream-To-White Gradient Segments */}
              <div className="flex items-end justify-between gap-1 h-14 px-1">
                {eqHeights.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full rounded-xs transition-all duration-100"
                      style={{
                        height: `${val}%`,
                        background:
                          val > 75
                            ? 'linear-gradient(to top, #5B0E14, #f1e194, #ffffff)'
                            : val > 40
                            ? 'linear-gradient(to top, #5B0E14, #f1e194)'
                            : 'linear-gradient(to top, #3b0a0e, #5B0E14)',
                        boxShadow: isPlaying ? '0 0 8px rgba(241, 225, 148, 0.45)' : 'none',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Deck Status Footnote */}
            <div className="w-full mt-3 flex items-center justify-between text-[11px] font-mono text-[#ffffff]/70 px-1">
              <span className="flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-[#f1e194]" />
                <span className="text-[#f1e194]">DIRECT DRIVE PIZZA DISC</span>
              </span>
              <span className="text-[#ffffff] font-bold">
                {isPlaying ? 'STYLUS ENGAGED 🍕' : 'STYLUS PARKED'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
