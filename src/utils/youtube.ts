/**
 * Extract YouTube 11-character video ID from various link formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 * - https://www.youtube.com/v/dQw4w9WgXcQ
 * - https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * - Direct ID: dQw4w9WgXcQ
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already directly an 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common regex covering youtu.be, youtube.com/watch, embed, v, shorts, etc.
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback search for any 11-char pattern after v= or v%3D
  const vParamMatch = trimmed.match(/[?&]v(?:%3D|=)([a-zA-Z0-9_-]{11})/i);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  return null;
}

/**
 * Extract YouTube Playlist ID from URL or direct ID:
 * - https://www.youtube.com/playlist?list=PLrAlrXy4A6r...
 * - https://www.youtube.com/watch?v=...&list=PL...
 * - https://music.youtube.com/playlist?list=PL...
 * - Direct ID: PLrAlrXy4A6r...
 */
export function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already directly a standard playlist ID (e.g. PL..., RD..., UU..., LL..., FL..., OLAK5uy_...)
  if (/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Check URL search parameters ?list= or &list=
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  // Generic fallback if user passed 12+ char alphanumeric token
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Clean up standard YouTube title noise like:
 * "(Official Video)", "[Official Music Video]", "(Lyric Video)", "[4K]", etc.
 */
export function cleanYouTubeTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(
      /\s*[\(\[]\s*(official\s*(music\s*)?video|official\s*audio|visualizer|lyric\s*video|lyrics|4k|hd|remastered|audio|video|full\s*song|video\s*song|audio\s*song|hd\s*video|official)\s*[\)\]]/gi,
      ''
    )
    .replace(/\s*\|\s*(official\s*(music\s*)?video|t-series|vevo|sony\s*music|zee\s*music).*/gi, '')
    .trim();
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Fetches YouTube video title and author/channel name using CORS-friendly oEmbed.
 */
export async function fetchYouTubeVideoMetadata(
  videoId: string
): Promise<{ title: string; author: string } | null> {
  if (!videoId) return null;
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title) {
      return {
        title: cleanYouTubeTitle(data.title),
        author: data.author_name || '',
      };
    }
  } catch {
    // Ignore network/CORS error
  }
  return null;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface ExtractedPlaylistSong {
  title: string;
  artist: string;
  videoId: string;
}

/**
 * Scrapes a public YouTube Playlist XML feed using a CORS-safe proxy.
 * Parses each <entry> node to extract:
 * - exact song name (<title>)
 * - artist/channel (<author><name>)
 * - video ID (<yt:videoId>)
 */
export async function fetchYouTubePlaylistVideos(
  playlistId: string,
  onProgress?: (message: string) => void
): Promise<{ songs: ExtractedPlaylistSong[]; playlistTitle?: string; error?: string }> {
  const targetFeedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;

  // Multiple CORS-safe proxies with allorigins as primary
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetFeedUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetFeedUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetFeedUrl)}`,
  ];

  let xmlText = '';
  let lastError = '';

  for (const proxyUrl of proxies) {
    try {
      if (onProgress) onProgress('Connecting to YouTube feed via proxy...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/xml, text/xml, */*' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        xmlText = await res.text();
        if (xmlText && (xmlText.includes('<feed') || xmlText.includes('<entry'))) {
          break; // successfully retrieved valid XML feed
        }
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (!xmlText || (!xmlText.includes('<feed') && !xmlText.includes('<entry'))) {
    return {
      songs: [],
      error:
        lastError ||
        'Playlist feed load nahi ho paya. Kripya check karein ki playlist Public ya Unlisted hai.',
    };
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return { songs: [], error: 'YouTube feed ka XML format parse nahi ho saka.' };
    }

    const playlistTitle =
      xmlDoc.querySelector('feed > title')?.textContent?.trim() || 'YouTube Playlist';
    const entries = Array.from(xmlDoc.querySelectorAll('entry'));

    if (entries.length === 0) {
      return {
        songs: [],
        playlistTitle,
        error: 'Playlist khali hai ya koi public video nahi mila.',
      };
    }

    const songs: ExtractedPlaylistSong[] = [];
    const seenVideoIds = new Set<string>();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Extract video ID using XML namespace or tag name
      let videoId =
        entry.getElementsByTagNameNS('http://www.youtube.com/xml/schemas/2015', 'videoId')[0]
          ?.textContent ||
        entry.getElementsByTagName('yt:videoId')[0]?.textContent ||
        entry.getElementsByTagName('videoId')[0]?.textContent ||
        '';

      if (!videoId) {
        // Fallback: extract from alternate link href
        const linkHref =
          entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || '';
        const match = linkHref.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
      }

      if (!videoId) {
        // Fallback: extract from <id>yt:video:VIDEO_ID</id>
        const idText = entry.querySelector('id')?.textContent || '';
        const idMatch = idText.match(/yt:video:([a-zA-Z0-9_-]{11})/);
        if (idMatch) videoId = idMatch[1];
      }

      videoId = videoId.trim();
      if (!videoId || seenVideoIds.has(videoId)) {
        continue;
      }
      seenVideoIds.add(videoId);

      // Extract raw title and clean it
      const rawTitle =
        entry.querySelector('title')?.textContent ||
        entry.getElementsByTagName('title')[0]?.textContent ||
        'Untitled Track';
      const cleanTitle = cleanYouTubeTitle(rawTitle);

      // Extract author / artist name
      const authorName =
        entry.querySelector('author > name')?.textContent ||
        entry.getElementsByTagName('author')[0]?.getElementsByTagName('name')[0]?.textContent ||
        '';

      let finalTitle = cleanTitle;
      let finalArtist = authorName.trim() || 'Hacky Pizza Lounge';

      // If title includes "Artist - Song", separate them cleanly
      if (cleanTitle.includes(' - ')) {
        const parts = cleanTitle.split(' - ');
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          finalArtist = parts[0].trim();
          finalTitle = parts.slice(1).join(' - ').trim();
        }
      }

      if (onProgress) {
        onProgress(`Extracted: [${finalTitle}] - Saving...`);
      }

      songs.push({
        title: finalTitle || rawTitle,
        artist: finalArtist,
        videoId,
      });
    }

    return { songs, playlistTitle };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { songs: [], error: `XML parse exception: ${msg}` };
  }
}
