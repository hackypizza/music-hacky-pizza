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
} from 'lucide-react';
import { Song } from '../types';
import { formatTime, getYouTubeThumbnail } from '../utils/youtube';

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
  onOpenTapeRack?: () => void;
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

  const thumbnail = currentSong?.youtubeId
    ? getYouTubeThumbnail(currentSong.youtubeId)
    : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#000000]/95 border-t-2 border-[#5B0E14] backdrop-blur-xl px-3 py-2 sm:px-6 sm:py-2.5 shadow-[0_-10px_35px_rgba(0,0,0,0.95)]">
      <div className="max-w-6xl mx-auto flex flex-col gap-1.5">
        {/* Top Slim Scrubber Progress Bar */}
        <div className="w-full flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-[#f1e194] font-bold w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group flex items-center">
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              step="0.5"
              value={currentTime}
              onChange={handleProgressChange}
              disabled={!hasSongs || duration === 0}
              className="w-full h-1.5 bg-[#1c0507] rounded-lg appearance-none cursor-pointer accent-[#f1e194] hover:accent-[#ffffff] transition-all border border-[#5B0E14]/70"
            />
          </div>

          <span className="text-[10px] font-mono text-[#ffffff]/60 w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Bottom Bar: Track Info (Left), Controls (Center), Volume & Ambience (Right) */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Small Thumbnail, Track Title, Artist */}
          <div className="flex items-center gap-3 min-w-0 max-w-[35%] sm:max-w-[40%]">
            {/* Small Thumbnail */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#5B0E14] border border-[#f1e194]/40 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={currentSong?.title || 'Track'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-base">🍕</span>
              )}
            </div>

            {/* Song Title & Artist */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-[#ffffff] truncate tracking-wide leading-tight">
                  {currentSong ? currentSong.title : 'Koi gaana select nahi hai'}
                </span>
                {isPlaying && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f1e194] shadow-[0_0_6px_#f1e194] animate-ping shrink-0" />
                )}
              </div>
              <div className="text-[10px] sm:text-xs font-mono text-[#f1e194]/80 truncate mt-0.5">
                {currentSong ? currentSong.artist : 'List se gaana play karein'}
              </div>
            </div>
          </div>

          {/* Center: Essential Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Previous */}
            <button
              onClick={onPrev}
              disabled={!hasSongs}
              title="Pichhla Gaana"
              className="p-2 sm:p-2.5 bg-[#000000]/70 hover:bg-[#5B0E14] text-[#ffffff] hover:text-[#f1e194] rounded-lg border border-[#5B0E14] hover:border-[#f1e194]/60 transition-all disabled:opacity-40 active:translate-y-0.5 shadow-sm"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play / Pause Circular Button */}
            <button
              onClick={onPlayPause}
              disabled={!hasSongs}
              title={isPlaying ? 'Roko' : 'Play Karein'}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md ${
                isPlaying
                  ? 'bg-[#f1e194] text-[#000000] border-2 border-[#ffffff] shadow-[0_0_15px_rgba(241,225,148,0.6)]'
                  : 'bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border-2 border-[#f1e194] shadow-[0_0_12px_rgba(91,14,20,0.5)]'
              } disabled:opacity-40`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!hasSongs}
              title="Agla Gaana"
              className="p-2 sm:p-2.5 bg-[#000000]/70 hover:bg-[#5B0E14] text-[#ffffff] hover:text-[#f1e194] rounded-lg border border-[#5B0E14] hover:border-[#f1e194]/60 transition-all disabled:opacity-40 active:translate-y-0.5 shadow-sm"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Master Volume Slider & Ambient Rain/Vinyl Toggles */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Night Rain Toggle */}
            <button
              onClick={onToggleNightRain}
              title={nightRain ? 'Raat Ki Baarish: CHALU' : 'Raat Ki Baarish: BAND'}
              className={`p-2 rounded-lg border transition-all text-xs font-mono hidden md:flex items-center gap-1 ${
                nightRain
                  ? 'bg-[#5B0E14] border-[#f1e194] text-[#f1e194] shadow-[0_0_10px_rgba(241,225,148,0.3)]'
                  : 'bg-[#000000]/60 border-[#5B0E14] text-[#ffffff]/60 hover:text-[#f1e194] hover:border-[#f1e194]'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>

            {/* Vinyl Scratch Toggle */}
            <button
              onClick={onToggleVinylCrackle}
              title={vinylCrackle ? 'Vinyl Scratch: CHALU' : 'Vinyl Scratch: BAND'}
              className={`p-2 rounded-lg border transition-all text-xs font-mono hidden md:flex items-center gap-1 ${
                vinylCrackle
                  ? 'bg-[#5B0E14] border-[#f1e194] text-[#f1e194] shadow-[0_0_10px_rgba(241,225,148,0.3)]'
                  : 'bg-[#000000]/60 border-[#5B0E14] text-[#ffffff]/60 hover:text-[#f1e194] hover:border-[#f1e194]'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
            </button>

            {/* Volume Slider with Mute button */}
            <div className="flex items-center gap-2 bg-[#000000]/80 px-2.5 py-1.5 rounded-lg border border-[#5B0E14]">
              <button
                onClick={onToggleMute}
                className="hover:scale-110 transition-transform shrink-0"
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
                className="w-14 sm:w-20 md:w-24 h-1 bg-[#1c0507] rounded-lg appearance-none cursor-pointer accent-[#f1e194] hover:accent-[#ffffff] transition-all border border-[#5B0E14]/70"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
