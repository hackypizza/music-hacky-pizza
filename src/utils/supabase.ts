import { createClient } from '@supabase/supabase-js';
import { Song } from '../types';

export const SUPABASE_URL = 'https://hvznwrigrcwrdbstcsdf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_n7MIsW7yxld9XOzxLyaabg_QPMGxbj2';

// Priority: window.supabase.createClient (from CDN in index.html), fallback to @supabase/supabase-js createClient
export const supabase =
  typeof window !== 'undefined' && (window as any).supabase?.createClient
    ? (window as any).supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabasePlaylistRow {
  id: string | number;
  title: string;
  youtube_id?: string;
  youtubeId?: string;
  artist?: string;
  category?: string;
  created_at?: string;
  chef_mood_tag?: string;
  chefMoodTag?: string;
}

export interface FetchResult {
  songs: Song[];
  isTableMissing: boolean;
  error: string | null;
}

/**
 * Live Playlist Sync:
 * Fetch all songs from the 'playlist' table ordered by 'created_at'
 */
export async function fetchPlaylistFromSupabase(): Promise<FetchResult> {
  try {
    const { data, error } = await supabase
      .from('playlist')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      const isMissing =
        error.code === 'PGRST205' ||
        error.message.includes('schema cache') ||
        error.message.includes('does not exist') ||
        error.message.includes('relation');

      return {
        songs: [],
        isTableMissing: isMissing,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        songs: [],
        isTableMissing: false,
        error: null,
      };
    }

    // Map database rows to Song model
    const mappedSongs: Song[] = (data as SupabasePlaylistRow[]).map((row, index) => {
      const ytId = row.youtube_id || row.youtubeId || '';
      return {
        id: String(row.id || `sp-${index}`),
        title: row.title || 'Untitled Track',
        artist: row.artist || 'Hacky Pizza Lounge',
        youtubeId: ytId,
        category: row.category || 'All',
        chefMoodTag: row.chef_mood_tag || row.chefMoodTag || undefined,
        addedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        isDbRecord: true,
      };
    });

    return {
      songs: mappedSongs,
      isTableMissing: false,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      songs: [],
      isTableMissing: false,
      error: msg,
    };
  }
}

/**
 * 1. Admin Panel Track Insertion:
 * Ensure Supabase insert payload includes:
 * {
 *   title: trackTitle,
 *   artist: trackArtist || 'Hacky Pizza Lounge',
 *   youtube_id: ytVideoId,
 *   category: selectedOrNewCategory || 'All'
 * }
 */
export async function addSongToSupabase(payload: {
  title: string;
  youtube_id: string;
  artist?: string;
  category?: string;
  chef_mood_tag?: string;
}): Promise<{ data: SupabasePlaylistRow | null; error: string | null }> {
  try {
    const trackTitle = payload.title.trim();
    const ytVideoId = payload.youtube_id.trim();
    const trackArtist = payload.artist?.trim() || 'Hacky Pizza Lounge';
    const selectedOrNewCategory = payload.category?.trim() || 'All';

    const fullPayload = {
      title: trackTitle,
      artist: trackArtist,
      youtube_id: ytVideoId,
      category: selectedOrNewCategory,
    };

    const { data, error } = await supabase
      .from('playlist')
      .insert([fullPayload])
      .select();

    if (error) {
      // Graceful fallback if table exists but was created without artist/category columns
      if (error.message.includes('column') || error.code === '42703') {
        const minimalFallback = {
          title: trackTitle,
          youtube_id: ytVideoId,
        };
        const fallbackRes = await supabase.from('playlist').insert([minimalFallback]).select();
        if (fallbackRes.error) {
          return { data: null, error: fallbackRes.error.message };
        }
        const row = fallbackRes.data && fallbackRes.data.length > 0 ? (fallbackRes.data[0] as SupabasePlaylistRow) : null;
        return { data: row, error: null };
      }
      return { data: null, error: error.message };
    }

    const firstRow = data && data.length > 0 ? (data[0] as SupabasePlaylistRow) : null;
    return { data: firstRow, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { data: null, error: msg };
  }
}

/**
 * Delete a track by ID from Supabase 'playlist' table
 */
export async function deleteSongFromSupabase(id: string | number): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from('playlist').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * 2. Category Management & Delete Feature:
 * When a category is deleted, update all tracks belonging to that category in Supabase to 'All'
 * or delete them based on chosen action.
 */
export async function deleteCategoryFromSupabase(
  categoryToDelete: string,
  action: 'reassign_to_all' | 'delete_tracks' = 'reassign_to_all'
): Promise<{ success: boolean; affectedCount: number; error: string | null }> {
  try {
    if (!categoryToDelete || categoryToDelete === 'All') {
      return { success: false, affectedCount: 0, error: 'Cannot delete root "All" category' };
    }

    if (action === 'reassign_to_all') {
      const { data, error } = await supabase
        .from('playlist')
        .update({ category: 'All' })
        .eq('category', categoryToDelete)
        .select();

      if (error) {
        return { success: false, affectedCount: 0, error: error.message };
      }
      return { success: true, affectedCount: data?.length || 0, error: null };
    } else {
      const { data, error } = await supabase
        .from('playlist')
        .delete()
        .eq('category', categoryToDelete)
        .select();

      if (error) {
        return { success: false, affectedCount: 0, error: error.message };
      }
      return { success: true, affectedCount: data?.length || 0, error: null };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, affectedCount: 0, error: msg };
  }
}

/**
 * Seed initial songs into Supabase 'playlist' table including artist and category
 */
export async function seedInitialSongsToSupabase(songsToSeed: Song[]): Promise<{ count: number; error: string | null }> {
  try {
    const rows = songsToSeed.map((s) => ({
      title: s.title,
      artist: s.artist || 'Hacky Pizza Lounge',
      youtube_id: s.youtubeId,
      category: s.category || 'All',
    }));

    const { data, error } = await supabase.from('playlist').insert(rows).select();
    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: data?.length || 0, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { count: 0, error: msg };
  }
}

/**
 * Batch Save to Supabase:
 * Insert an extracted array of songs into the 'playlist' table:
 * {
 *   title: songTitle,
 *   artist: artistName,
 *   youtube_id: videoId,
 *   category: selectedCategory
 * }
 * Skips duplicate youtube_id entries against both the existing database rows
 * and within the input batch.
 */
export async function batchAddSongsToSupabase(
  songsToAdd: {
    title: string;
    artist: string;
    youtube_id: string;
    category: string;
  }[]
): Promise<{
  addedCount: number;
  skippedCount: number;
  insertedRows: SupabasePlaylistRow[];
  error: string | null;
}> {
  try {
    if (!songsToAdd || songsToAdd.length === 0) {
      return {
        addedCount: 0,
        skippedCount: 0,
        insertedRows: [],
        error: 'Koi gaana nahi mila add karne ke liye.',
      };
    }

    // 1. Fetch existing youtube_ids from Supabase to skip duplicates
    const { data: existingData, error: fetchErr } = await supabase
      .from('playlist')
      .select('youtube_id');

    const existingIdSet = new Set<string>();
    if (!fetchErr && existingData) {
      existingData.forEach((row: { youtube_id?: string }) => {
        if (row.youtube_id) existingIdSet.add(row.youtube_id.trim());
      });
    }

    // 2. Filter out duplicates from songsToAdd
    const seenInBatch = new Set<string>();
    const uniqueToInsert: {
      title: string;
      artist: string;
      youtube_id: string;
      category: string;
    }[] = [];

    for (const item of songsToAdd) {
      const ytId = item.youtube_id.trim();
      if (!ytId) continue;
      if (existingIdSet.has(ytId) || seenInBatch.has(ytId)) {
        continue;
      }
      seenInBatch.add(ytId);
      uniqueToInsert.push({
        title: item.title.trim(),
        artist: item.artist.trim() || 'Hacky Pizza Lounge',
        youtube_id: ytId,
        category: item.category.trim() || 'All',
      });
    }

    const skippedCount = songsToAdd.length - uniqueToInsert.length;

    if (uniqueToInsert.length === 0) {
      return {
        addedCount: 0,
        skippedCount,
        insertedRows: [],
        error: null,
      };
    }

    // 3. Batch insert unique records in chunks of 50
    const insertedRows: SupabasePlaylistRow[] = [];
    const chunkSize = 50;

    for (let i = 0; i < uniqueToInsert.length; i += chunkSize) {
      const chunk = uniqueToInsert.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('playlist').insert(chunk).select();

      if (error) {
        // Fallback if table doesn't have artist/category columns
        if (error.message.includes('column') || error.code === '42703') {
          const minimalChunk = chunk.map((c) => ({
            title: c.title,
            youtube_id: c.youtube_id,
          }));
          const fallbackRes = await supabase.from('playlist').insert(minimalChunk).select();
          if (fallbackRes.error) {
            return {
              addedCount: insertedRows.length,
              skippedCount,
              insertedRows,
              error: fallbackRes.error.message,
            };
          }
          if (fallbackRes.data) {
            insertedRows.push(...(fallbackRes.data as SupabasePlaylistRow[]));
          }
        } else {
          return {
            addedCount: insertedRows.length,
            skippedCount,
            insertedRows,
            error: error.message,
          };
        }
      } else if (data) {
        insertedRows.push(...(data as SupabasePlaylistRow[]));
      }
    }

    return {
      addedCount: insertedRows.length,
      skippedCount,
      insertedRows,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { addedCount: 0, skippedCount: 0, insertedRows: [], error: msg };
  }
}

export const SUPABASE_SETUP_SQL = `-- Esegui questo script nell'editor SQL del tuo progetto Supabase:
CREATE TABLE IF NOT EXISTS public.playlist (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Hacky Pizza Lounge',
  youtube_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita RLS con accesso per la webapp:
ALTER TABLE public.playlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read" ON public.playlist
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert" ON public.playlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow anon update" ON public.playlist
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete" ON public.playlist
  FOR DELETE TO anon, authenticated USING (true);
`;
