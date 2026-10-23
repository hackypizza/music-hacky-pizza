import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  CloudRain,
  Disc,
  Library,
} from 'lucide-react';
import { Song } from '../types';
import { formatTime } from '../utils/youtube';

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  vinylCrackle: boolean;
  nightRain: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleVinylCrackle: () => void;
  onToggleNightRain: () => void;
  onOpenTapeRack: () => void;
  hasSongs: boolean;
}

export default function PlayerControls({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  vinylCrackle,
  nightRain,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleVinylCrackle,
  onToggleNightRain,
  onOpenTapeRack,
  hasSongs,
}: PlayerControlsProps) {
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  const currentVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4 text-red-400" />;
    if (volume < 50) return <Volume1 className="w-4 h-4 text-[#f1e194]" />;
    return <Volume2 className="w-4 h-4 text-[#f1e194]" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-b from-[#5B0E14]/35 via-[#000000]/95 to-[#5B0E14]/20 border-2 border-[#5B0E14] hover:border-[#f1e194] backdrop-blur-xl rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_25px_rgba(241,225,148,0.2)] transition-all duration-300">
      {/* Now Playing Header Block */}
      <div className="mb-4 pb-3 border-b border-[#5B0E14]/70 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {/* Animated Sound-Wave Pulse Equalizer */}
            <div className="flex items-end gap-1 h-4 w-6 px-0.5" title={isPlaying ? 'Gaana Baj Raha Hai' : 'Gaana Roka Hua Hai'}>
              <span className={`w-1 rounded-full bg-[#f1e194] ${isPlaying ? 'wave-bar-1' : 'h-1'}`} />
              <span className={`w-1 rounded-full bg-[#f1e194] ${isPlaying ? 'wave-bar-2' : 'h-1.5'}`} />
              <span className={`w-1 rounded-full bg-[#f1e194] ${isPlaying ? 'wave-bar-3' : 'h-2'}`} />
              <span className={`w-1 rounded-full bg-[#f1e194] ${isPlaying ? 'wave-bar-4' : 'h-1'}`} />
            </div>

            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#f1e194] flex items-center gap-1.5">
              <span>Abhi Baj Raha Hai: {currentSong?.category || 'Lo-Fi Cafe'} · {isPlaying ? 'PLAYING' : 'PAUSED'}</span>
              {isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#f1e194] shadow-[0_0_6px_#f1e194] animate-ping" />
              )}
            </span>
          </div>

          {/* Primary Legible Track Title in Pure White #ffffff with golden glow accent when active */}
          <div className="font-cinzel font-bold text-base sm:text-lg md:text-xl text-[#ffffff] truncate tracking-wide leading-tight flex items-center gap-2">
            <span
              className={
                isPlaying
                  ? 'text-[#ffffff] drop-shadow-[0_0_12px_rgba(241,225,148,0.65)]'
                  : 'text-[#ffffff]/90'
              }
            >
              {currentSong ? currentSong.title : 'Koi gaana select nahi hai'}
            </span>
          </div>
          {/* Artist in Warm Cream #f1e194 */}
          <div className="text-xs font-mono text-[#f1e194]/85 truncate mt-0.5 flex items-center gap-1.5">
            <span>{currentSong ? currentSong.artist : 'List se koi gaana chunein ya naya add karein'}</span>
          </div>
        </div>

        {/* Vintage Hi-Fi Badge in Deep Wine #5B0E14 & Cream #f1e194 */}
        <div className="shrink-0 text-right hidden sm:block">
          <span className="text-[9px] font-mono text-[#ffffff]/60 block">STEREO HI-FI</span>
          <span className="text-[10px] font-mono font-bold text-[#f1e194] bg-[#5B0E14]/80 px-2 py-0.5 rounded border border-[#f1e194]/40 shadow-sm">
            44.1 kHz
          </span>
        </div>
      </div>

      {/* Progress Bar & Timestamps */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-mono text-[#f1e194]/90 mb-1.5">
          <span className="font-receipt text-base text-[#f1e194] font-bold tracking-wider">
            {formatTime(currentTime)}
          </span>
          <span className="text-[11px] font-mono text-[#ffffff]/70">
            {formatTime(duration)}
          </span>
        </div>

        <div className="relative group">
          <input
            type="range"
            min="0"
            max={duration > 0 ? duration : 100}
            step="0.5"
            value={currentTime}
            onChange={handleProgressChange}
            disabled={!hasSongs || duration === 0}
            className="w-full h-2 bg-[#000000] rounded-lg appearance-none cursor-pointer accent-[#f1e194] hover:accent-[#ffffff] transition-all border border-[#5B0E14]"
          />
        </div>
      </div>

      {/* Main Deck Controls: Tactile Buttons in #5B0E14, #f1e194, #ffffff */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Previous Track */}
          <button
            onClick={onPrev}
            disabled={!hasSongs}
            title="Pichhla Gaana"
            className="p-3 bg-[#000000]/70 hover:bg-[#5B0E14] active:translate-y-0.5 text-[#ffffff] rounded-xl border border-[#5B0E14] hover:border-[#f1e194] transition-all disabled:opacity-40 disabled:pointer-events-none shadow"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Glowing Main Play/Pause Button in #f1e194 & #5B0E14 */}
          <button
            onClick={onPlayPause}
            disabled={!hasSongs}
            title={isPlaying ? 'Roko' : 'Play Karein'}
            className={`px-7 py-3 rounded-xl border font-cinzel font-bold text-sm tracking-wider flex items-center gap-2.5 transition-all active:translate-y-0.5 shadow-lg ${
              isPlaying
                ? 'bg-[#f1e194] border-[#ffffff] text-[#000000] shadow-[0_0_20px_rgba(241,225,148,0.55)] scale-[1.02]'
                : 'bg-[#5B0E14] hover:bg-[#78131a] border-[#f1e194] text-[#ffffff] shadow-[0_0_15px_rgba(91,14,20,0.5)]'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Roko</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Karein</span>
              </>
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            disabled={!hasSongs}
            title="Agla Gaana"
            className="p-3 bg-[#000000]/70 hover:bg-[#5B0E14] active:translate-y-0.5 text-[#ffffff] rounded-xl border border-[#5B0E14] hover:border-[#f1e194] transition-all disabled:opacity-40 disabled:pointer-events-none shadow"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Vinyl Library / Rack Drawer */}
          <button
            onClick={onOpenTapeRack}
            title="Gaano Ki List Kholein"
            className="p-3 bg-[#000000]/70 hover:bg-[#5B0E14] active:translate-y-0.5 text-[#f1e194] rounded-xl border border-[#5B0E14] hover:border-[#f1e194] transition-all shadow flex items-center gap-1.5 text-xs font-mono"
          >
            <Library className="w-4 h-4 text-[#f1e194]" />
            <span className="hidden md:inline font-bold">GAANE</span>
          </button>
        </div>

        {/* Ambient toggles & Volume slider */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Night Rain Toggle */}
          <button
            onClick={onToggleNightRain}
            title={nightRain ? 'Raat Ki Baarish: CHALU' : 'Raat Ki Baarish: BAND'}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
              nightRain
                ? 'bg-[#5B0E14] border-[#f1e194] text-[#f1e194] shadow-[0_0_12px_rgba(241,225,148,0.35)]'
                : 'bg-[#000000]/70 border-[#5B0E14] text-[#ffffff]/60 hover:text-[#f1e194] hover:border-[#f1e194]'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">BAARISH</span>
          </button>

          {/* Vinyl Crackle Warmth Toggle */}
          <button
            onClick={onToggleVinylCrackle}
            title={vinylCrackle ? 'Vinyl Scratch: CHALU' : 'Vinyl Scratch: BAND'}
            className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
              vinylCrackle
                ? 'bg-[#5B0E14] border-[#f1e194] text-[#f1e194] shadow-[0_0_12px_rgba(241,225,148,0.35)]'
                : 'bg-[#000000]/70 border-[#5B0E14] text-[#ffffff]/60 hover:text-[#f1e194] hover:border-[#f1e194]'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">VINYL SCRATCH</span>
          </button>

          {/* Master Volume Slider with Mute button */}
          <div className="flex items-center gap-2 bg-[#000000]/90 px-3 py-2 rounded-xl border border-[#5B0E14]">
            <button
              onClick={onToggleMute}
              className="hover:scale-110 transition-transform"
              title={isMuted ? 'Awaaz Kholein (Unmute)' : 'Mute Karein'}
            >
              {currentVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
              className="w-18 sm:w-22 h-1.5 bg-[#5B0E14]/60 rounded appearance-none cursor-pointer accent-[#f1e194]"
              title="Awaaz Badhayein ya Kam Karein"
            />
            <span className="text-[10px] font-mono text-[#f1e194] w-6 text-right tabular-nums">
              {isMuted ? 0 : volume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
