import { useEffect, useRef, useState, useCallback } from 'react';
import { Song } from '../types';

// YouTube IFrame API global typings
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number; target: YTPlayerInstance }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(options: { videoId: string; startSeconds?: number } | string): void;
  cueVideoById(options: { videoId: string; startSeconds?: number } | string): void;
  destroy(): void;
}

interface YouTubeEngineProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  seekTarget: number | null;
  onTrackEnd: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (isPlaying: boolean) => void;
  onError: (errorMessage: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

/**
 * Creates a clean, 2-second 44.1kHz mono PCM WAV Blob containing 100% mathematical zero-amplitude
 * silence. Because every byte in the data chunk is 0x00, there is zero DC offset, zero frequency
 * content, and zero click/beep artifact when looped or restarted.
 */
function createPureSilentAudioBlobUrl(): string {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSec = 2;
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // File length - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1)
  view.setUint32(24, sampleRate, true); // SampleRate (44100)
  view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  view.setUint16(32, numChannels * 2, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample (16)

  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Samples are all 0 in the newly allocated ArrayBuffer (pure zero silence)
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export default function YouTubeEngine({
  currentSong,
  isPlaying,
  volume,
  isMuted,
  seekTarget,
  onTrackEnd,
  onTimeUpdate,
  onStateChange,
  onError,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: YouTubeEngineProps) {
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isApiLoadedRef = useRef<boolean>(false);
  const lastLoadedVideoIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Dynamic clean pure-silence audio Blob URL
  const [silentAudioUrl, setSilentAudioUrl] = useState<string>('');

  // Keep latest callback references for MediaSession handlers to prevent duplicate attachments
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onTrackEndRef = useRef(onTrackEnd);

  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onTrackEndRef.current = onTrackEnd;
  });

  // Generate pure silent audio Blob URL once on mount
  useEffect(() => {
    const url = createPureSilentAudioBlobUrl();
    setSilentAudioUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  // 1. Screen Wake Lock API Management
  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!wakeLockRef.current) {
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          if (wakeLockRef.current === sentinel) {
            wakeLockRef.current = null;
          }
        });
      }
    } catch {
      // Screen WakeLock may be rejected in battery-saver or inactive tab
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Ignore
      }
      wakeLockRef.current = null;
    }
  }, []);

  // Sync WakeLock with playing state
  useEffect(() => {
    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying, requestWakeLock, releaseWakeLock]);

  // Re-request WakeLock when tab returns to visibility while playing
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isPlaying, requestWakeLock]);

  // 2. Clean MediaSession Action Handlers Registration (Registered once on mount without duplicate listeners)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const actionMap: [MediaSessionAction, MediaSessionActionHandler][] = [
      [
        'play',
        () => {
          if (onPlayRef.current) onPlayRef.current();
          else if (playerRef.current) playerRef.current.playVideo();
        },
      ],
      [
        'pause',
        () => {
          if (onPauseRef.current) onPauseRef.current();
          else if (playerRef.current) playerRef.current.pauseVideo();
        },
      ],
      [
        'previoustrack',
        () => {
          if (onPrevRef.current) onPrevRef.current();
        },
      ],
      [
        'nexttrack',
        () => {
          if (onNextRef.current) onNextRef.current();
          else if (onTrackEndRef.current) onTrackEndRef.current();
        },
      ],
    ];

    actionMap.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Browser does not support this specific media action
      }
    });

    return () => {
      actionMap.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore
        }
      });
    };
  }, []);

  // Update MediaSession metadata and playbackState
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !currentSong) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'Hacky Pizza Lounge',
        album: 'Hacky Pizza Town Jukebox',
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=512',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      console.warn('MediaSession metadata error:', e);
    }
  }, [currentSong, isPlaying]);

  // 3. Clean Silent HTML5 Audio Loop Keep-Alive (Zero click/beep frequency)
  useEffect(() => {
    const silentEl = silentAudioRef.current;
    if (!silentEl) return;

    if (isPlaying) {
      silentEl.volume = 0.01;
      const playPromise = silentEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Waiting on user interaction per browser autoplay policy
        });
      }
    } else {
      // Completely pause and reset on Stop/Pause to prevent click or stutter
      silentEl.pause();
      silentEl.currentTime = 0;
    }
  }, [isPlaying]);

  // Clean up on track change or replay: reset silent audio element and clear old interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (silentAudioRef.current) {
      silentAudioRef.current.currentTime = 0;
    }
  }, [currentSong?.id]);

  // 4. Load YouTube IFrame API Script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      isApiLoadedRef.current = true;
      initPlayer();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      isApiLoadedRef.current = true;
      initPlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const initPlayer = () => {
    if (!window.YT || !window.YT.Player || playerRef.current || !containerRef.current) return;

    try {
      const player = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        videoId: currentSong?.youtubeId || '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target;
            event.target.setVolume(volume);
            if (isMuted) {
              event.target.mute();
            } else {
              event.target.unMute();
            }

            if (currentSong) {
              lastLoadedVideoIdRef.current = currentSong.youtubeId;
              if (isPlaying) {
                event.target.playVideo();
              }
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              onStateChange(true);
            } else if (state === window.YT.PlayerState.PAUSED) {
              onStateChange(false);
            } else if (state === window.YT.PlayerState.ENDED) {
              onTrackEnd();
            }
          },
          onError: (event) => {
            const code = event.data;
            let msg = 'Audio source could not be played.';
            if (code === 101 || code === 150) {
              msg = 'This track cannot be embedded due to YouTube restrictions. Skipping to next song...';
            } else if (code === 100) {
              msg = 'Track not found or removed. Skipping...';
            }
            onError(msg);
            setTimeout(() => {
              onTrackEnd();
            }, 1200);
          },
        },
      });
    } catch {
      // Fallback
    }
  };

  // Sync Video ID when currentSong changes
  useEffect(() => {
    if (!currentSong || !playerRef.current) return;

    if (lastLoadedVideoIdRef.current !== currentSong.youtubeId) {
      lastLoadedVideoIdRef.current = currentSong.youtubeId;
      try {
        if (isPlaying) {
          playerRef.current.loadVideoById(currentSong.youtubeId);
        } else {
          playerRef.current.cueVideoById(currentSong.youtubeId);
        }
      } catch {
        // Player maybe not fully ready yet
      }
    }
  }, [currentSong, isPlaying]);

  // Sync Play / Pause state on YouTube engine
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (isPlaying) {
        if (state !== window.YT?.PlayerState?.PLAYING) {
          playerRef.current.playVideo();
        }
      } else {
        if (state === window.YT?.PlayerState?.PLAYING) {
          playerRef.current.pauseVideo();
        }
      }
    } catch {
      // Handle browser autoplay policy restrictions
    }
  }, [isPlaying]);

  // Sync Volume & Mute
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setVolume(volume);
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch {
      // Ignore
    }
  }, [volume, isMuted]);

  // Handle Seek
  useEffect(() => {
    if (seekTarget === null || !playerRef.current) return;
    try {
      playerRef.current.seekTo(seekTarget, true);
    } catch {
      // Ignore
    }
  }, [seekTarget]);

  // 5. Steady, non-rapid polling (1000ms cadence) only when player is actively playing
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        if (!playerRef.current) return;
        try {
          const state = playerRef.current.getPlayerState?.();
          // Only poll time when in active PLAYING state (avoids rapid bridge calls when paused or buffering)
          if (state === window.YT?.PlayerState?.PLAYING) {
            const curr = playerRef.current.getCurrentTime?.() || 0;
            const dur = playerRef.current.getDuration?.() || 0;
            onTimeUpdate(curr, dur);
          }
        } catch {
          // Ignore
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, onTimeUpdate]);

  return (
    <>
      {/* Background Silent Audio Loop (Pure zero-amplitude mathematical silence buffer) */}
      {silentAudioUrl && (
        <audio
          ref={silentAudioRef}
          src={silentAudioUrl}
          preload="auto"
          loop
          playsInline
          aria-hidden="true"
          className="hidden pointer-events-none"
        />
      )}

      <div
        aria-hidden="true"
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      >
        <div ref={containerRef} id="youtube-audio-engine" />
      </div>
    </>
  );
}
