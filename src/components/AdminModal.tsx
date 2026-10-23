import { useState, useId } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  ChefHat,
  Download,
  Upload,
  Database,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Tag,
  Music2,
  Layers,
  ArrowRightLeft,
  ListPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Song } from '../types';
import {
  extractYouTubeId,
  extractPlaylistId,
  fetchYouTubePlaylistVideos,
  fetchYouTubeVideoMetadata,
  getYouTubeThumbnail,
} from '../utils/youtube';
import {
  addSongToSupabase,
  batchAddSongsToSupabase,
  deleteSongFromSupabase,
  deleteCategoryFromSupabase,
  seedInitialSongsToSupabase,
  SUPABASE_SETUP_SQL,
} from '../utils/supabase';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  categories: string[];
  isDbConnected: boolean;
  isTableMissing: boolean;
  onRefreshFromSupabase: () => Promise<void>;
  onDeleteCategory: (category: string, action: 'reassign_to_all' | 'delete_tracks') => Promise<void>;
  onAddCategory: (newCategory: string) => void;
  onPlaySong: (song: Song) => void;
  onImportPlaylist: (imported: Song[]) => void;
}

export default function AdminModal({
  isOpen,
  onClose,
  songs,
  categories,
  isDbConnected: _isDbConnected,
  isTableMissing,
  onRefreshFromSupabase,
  onDeleteCategory,
  onAddCategory,
  onPlaySong,
  onImportPlaylist,
}: AdminModalProps) {
  const customCatInputId = useId();
  const directCatInputId = useId();
  const bulkPlaylistInputId = useId();
  const bulkCategorySelectId = useId();
  const bulkCustomCatInputId = useId();

  // Navigation tab in Admin: 'tracks' | 'categories' | 'bulk-import'
  const [activeTab, setActiveTab] = useState<'tracks' | 'categories' | 'bulk-import'>('tracks');

  // PIN Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [currentPin, setCurrentPin] = useState<string>(() => {
    return localStorage.getItem('hpz_admin_pin') || '1234';
  });

  // Bulk YouTube Playlist Import State
  const [bulkPlaylistUrl, setBulkPlaylistUrl] = useState('');
  const [bulkCategory, setBulkCategory] = useState('90s Ka Magic');
  const [bulkCustomCategory, setBulkCustomCategory] = useState('');
  const [isBulkCustomCategory, setIsBulkCustomCategory] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkStatusText, setBulkStatusText] = useState('');
  const [bulkExtractedCount, setBulkExtractedCount] = useState<number>(0);
  const [bulkExtractedPreview, setBulkExtractedPreview] = useState<
    { title: string; artist: string; videoId: string }[]
  >([]);

  // Track Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [category, setCategory] = useState(categories[0] || 'All');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Category Management Form State
  const [newDirectCategory, setNewDirectCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryDeleteAction, setCategoryDeleteAction] = useState<'reassign_to_all' | 'delete_tracks'>('reassign_to_all');
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // SQL Helper Modal / Toggle
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Track Delete Confirmation
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extracted YouTube ID
  const extractedId = extractYouTubeId(youtubeUrl);
  const [isFetchingMeta, setIsFetchingMeta] = useState<boolean>(false);
  const [isBulkSectionOpen, setIsBulkSectionOpen] = useState<boolean>(false);

  // Auto-fetch YouTube song title & artist from video ID
  const handleAutoFetchMeta = async (idToFetch: string) => {
    if (!idToFetch) return;
    setIsFetchingMeta(true);
    try {
      const meta = await fetchYouTubeVideoMetadata(idToFetch);
      if (meta) {
        if (meta.title && (!title || title.trim() === '')) {
          setTitle(meta.title);
        }
        if (meta.author && (!artist || artist.trim() === '')) {
          setArtist(meta.author);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsFetchingMeta(false);
    }
  };

  // Keep input fully editable: If a full URL is pasted, auto-fill the 11-char ID and auto-fetch metadata
  const handleYoutubeInputChange = (val: string) => {
    setYoutubeUrl(val);
    const trimmed = val.trim();
    if (trimmed.includes('http') || trimmed.includes('youtu')) {
      const id = extractYouTubeId(trimmed);
      if (id) {
        // Auto-fill the 11-char ID into the input so it's clean and directly editable!
        setYoutubeUrl(id);
        handleAutoFetchMeta(id);
      }
    } else if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      // Direct 11-char ID typed or pasted
      if (!title || !artist) {
        handleAutoFetchMeta(trimmed);
      }
    }
  };

  if (!isOpen) return null;

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === currentPin) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Galat PIN! Kripya sahi PIN enter karein.');
    }
  };

  // 1. Submit track with full payload: { title, artist, youtube_id, category }
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const trackTitle = title.trim();
    if (!trackTitle) {
      setFormError('Gaane ka naam dalein.');
      return;
    }
    if (!extractedId) {
      setFormError('Kripya sahi YouTube link dalein.');
      return;
    }

    const trackArtist = artist.trim() || 'Hacky Pizza Lounge';
    const selectedOrNewCategory = isCustomCategory
      ? customCategory.trim() || 'All'
      : category || 'All';

    setIsSubmitting(true);

    try {
      const { error } = await addSongToSupabase({
        title: trackTitle,
        artist: trackArtist,
        youtube_id: extractedId,
        category: selectedOrNewCategory,
      });

      if (error) {
        if (
          error.includes('does not exist') ||
          error.includes('schema cache') ||
          error.includes('relation')
        ) {
          setFormError(
            `Database Error: Supabase me 'playlist' table nahi mila. "SQL Script Dekhein" par click karein.`
          );
          setShowSqlGuide(true);
        } else {
          setFormError(`Supabase Error: ${error}`);
        }
        setIsSubmitting(false);
        return;
      }

      setFormSuccess('Gaana add ho gaya!');

      // If new category, register it
      if (isCustomCategory && customCategory.trim()) {
        onAddCategory(customCategory.trim());
      }

      setTitle('');
      setArtist('');
      setYoutubeUrl('');
      setCustomCategory('');
      setIsCustomCategory(false);

      // Refresh list immediately from database
      await onRefreshFromSupabase();

      setTimeout(() => {
        setFormSuccess('');
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full YouTube Playlist Importer with exact Song Names & Custom Category selection
  const handleBulkPlaylistImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const targetCategory = (
      isBulkCustomCategory ? bulkCustomCategory.trim() : bulkCategory.trim()
    );

    if (!targetCategory) {
      setFormError('Kripya target category chunein ya nayi category ka naam enter karein.');
      return;
    }

    const playlistId = extractPlaylistId(bulkPlaylistUrl);
    if (!playlistId) {
      setFormError(
        'Kripya sahi YouTube Playlist link paste karein (e.g. https://www.youtube.com/playlist?list=PL...).'
      );
      return;
    }

    setIsBulkImporting(true);
    setBulkExtractedPreview([]);
    setBulkExtractedCount(0);
    setBulkStatusText('Connecting to YouTube feed via CORS proxy...');

    try {
      const { songs: extractedSongs, playlistTitle, error: fetchErr } =
        await fetchYouTubePlaylistVideos(playlistId, (msg) => {
          setBulkStatusText(msg);
        });

      if (fetchErr || !extractedSongs || extractedSongs.length === 0) {
        setFormError(fetchErr || 'Playlist se koi gaana extract nahi ho saka.');
        setIsBulkImporting(false);
        return;
      }

      setBulkExtractedPreview(extractedSongs.slice(0, 10));
      setBulkExtractedCount(extractedSongs.length);
      setBulkStatusText(
        `Extracted: ${extractedSongs.length} gaane (${playlistTitle || 'Playlist'}) - Supabase me save ho rahe hain...`
      );

      // Prepare batch payload for Supabase
      const payload = extractedSongs.map((s) => ({
        title: s.title,
        artist: s.artist || 'Hacky Pizza Lounge',
        youtube_id: s.videoId,
        category: targetCategory,
      }));

      const { addedCount, skippedCount, error: insertErr } = await batchAddSongsToSupabase(payload);

      if (insertErr) {
        setFormError(`Supabase me save karne me error: ${insertErr}`);
        setIsBulkImporting(false);
        return;
      }

      // Add category to local state if custom
      if (isBulkCustomCategory && bulkCustomCategory.trim()) {
        onAddCategory(targetCategory);
      }

      // Instantly refresh Supabase playlist and category filters
      await onRefreshFromSupabase();

      let successMsg = `Sabhi ${addedCount} gaane '${targetCategory}' me safalta-purvak add ho gaye! 🍕`;
      if (skippedCount > 0) {
        successMsg += ` (${skippedCount} duplicate gaane pehle se playlist me the aur skip kar diye gaye).`;
      }
      setFormSuccess(successMsg);
      setBulkStatusText(`Safalta-purvak save ho gaya: ${addedCount} gaane added.`);
      setBulkPlaylistUrl('');
      setBulkCustomCategory('');
      setIsBulkCustomCategory(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Playlist import error: ${msg}`);
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);

    try {
      const { success, error } = await deleteSongFromSupabase(songToDelete.id);
      if (!success) {
        setFormError(`Supabase se hatane me dikkat aayi: ${error}`);
      } else {
        setFormSuccess(`Gaana "${songToDelete.title}" Supabase se hata diya gaya.`);
        await onRefreshFromSupabase();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Delete error: ${msg}`);
    } finally {
      setIsDeleting(false);
      setSongToDelete(null);
    }
  };

  // 2. Category Delete Confirmation Handler
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    setFormError('');
    setFormSuccess('');

    try {
      await onDeleteCategory(categoryToDelete, categoryDeleteAction);
      setFormSuccess(
        categoryDeleteAction === 'reassign_to_all'
          ? `Category "${categoryToDelete}" delete ho gayi. Sabhi gaane 'Sabhi Gaane' me chale gaye.`
          : `Category "${categoryToDelete}" aur uske sabhi gaane delete kar diye gaye.`
      );
      setCategoryToDelete(null);
      await onRefreshFromSupabase();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Category delete karne me error: ${msg}`);
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleAddDirectCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newDirectCategory.trim();
    if (!cat) return;
    if (categories.includes(cat) || cat.toLowerCase() === 'all') {
      setFormError(`Yeh category "${cat}" pehle se maujood hai.`);
      return;
    }
    onAddCategory(cat);
    setNewDirectCategory('');
    setFormSuccess(`Nayi category "${cat}" successfully jud gayi!`);
    setTimeout(() => setFormSuccess(''), 3000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshFromSupabase();
    setIsRefreshing(false);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setFormError('');
    setFormSuccess('');
    try {
      const { count, error } = await seedInitialSongsToSupabase(songs);
      if (error) {
        if (error.includes('does not exist') || error.includes('schema cache')) {
          setFormError(
            "Supabase me 'playlist' table nahi mila. Pehle SQL Editor me script run karein."
          );
          setShowSqlGuide(true);
        } else {
          setFormError(`Supabase load error: ${error}`);
        }
      } else {
        setFormSuccess(`${count} gaane categories ke saath Supabase me load ho gaye!`);
        await onRefreshFromSupabase();
      }
    } finally {
      setIsSeeding(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(songs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'hacky_pizza_playlist.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onImportPlaylist(parsed);
            setFormSuccess(`${parsed.length} gaane JSON file se successfully import ho gaye!`);
          } else {
            setFormError('File format valid nahi hai.');
          }
        } catch {
          setFormError('JSON file read nahi ho payi.');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Frosted Glassmorphism Modal Body */}
      <div className="bg-[#000000]/95 border-2 border-[#5B0E14] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(91,14,20,0.4)] overflow-hidden text-[#ffffff] backdrop-blur-2xl">
        {/* Header */}
        <div className="bg-[#5B0E14]/30 border-b border-[#5B0E14] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#5B0E14] border border-[#f1e194]/40 rounded-xl text-[#f1e194] shadow-md">
              <ChefHat className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#ffffff] tracking-wider flex items-center gap-2">
                <span>KITCHEN COUNTER / LIVE JUKEBOX</span>
                {isAuthenticated && (
                  <span className="text-[10px] font-mono bg-[#5B0E14] text-[#f1e194] border border-[#f1e194]/50 px-2 py-0.5 rounded">
                    Chef Access / Staff Only
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#f1e194]/80 font-mono">
                <span className="flex items-center gap-1 text-[#f1e194]">
                  <Database className="w-3 h-3" />
                  <span>hvznwrigrcwrdbstcsdf.supabase.co</span>
                </span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">● Database Connected</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#ffffff]/60 hover:text-[#f1e194] hover:bg-[#5B0E14]/40 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs (When Authenticated) */}
        {isAuthenticated && (
          <div className="flex items-center border-b border-[#5B0E14] bg-[#000000]/60 px-6 pt-2 gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('tracks')}
              className={`pb-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'tracks'
                  ? 'border-[#f1e194] text-[#f1e194]'
                  : 'border-transparent text-[#ffffff]/60 hover:text-[#ffffff]'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Gaana Management ({songs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-[#f1e194] text-[#f1e194]'
                  : 'border-transparent text-[#ffffff]/60 hover:text-[#ffffff]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mood &amp; Category Management ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk-import')}
              className={`pb-2.5 px-4 font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'bulk-import'
                  ? 'border-[#f1e194] text-[#f1e194]'
                  : 'border-transparent text-[#ffffff]/60 hover:text-[#ffffff]'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Bulk YouTube Playlist Import 🍕</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            /* PIN Protection Screen */
            <div className="max-w-md mx-auto text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-[#5B0E14]/40 border border-[#5B0E14] flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-8 h-8 text-[#f1e194]" />
              </div>
              <h3 className="font-cinzel font-bold text-lg text-[#ffffff] mb-1">
                Staff PIN Dalein (Default: 1234)
              </h3>
              <p className="text-xs font-mono text-[#f1e194]/80 mb-6">
                Kitchen Counter Access Code:{' '}
                <span className="font-bold text-[#ffffff] bg-[#5B0E14] px-1.5 py-0.5 rounded">
                  1234
                </span>
              </p>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div className="flex justify-center gap-2">
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError('');
                    }}
                    placeholder="PIN Dalein"
                    autoFocus
                    className="w-48 text-center text-xl font-mono tracking-widest px-4 py-2.5 bg-[#000000] border-2 border-[#5B0E14] focus:border-[#f1e194] text-[#f1e194] rounded-xl outline-none shadow-inner"
                  />
                </div>

                {pinError && (
                  <div className="text-xs font-mono text-red-400 flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] font-cinzel font-bold text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(91,14,20,0.5)] active:translate-y-0.5"
                  >
                    Admin Panel Kholein
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Management View */
            <div className="space-y-6">
              {/* Alert Feedback Messages */}
              {formError && (
                <div className="p-3 rounded-xl bg-[#5B0E14]/80 border border-red-500 text-red-200 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Database Status Alert Banner */}
              {isTableMissing && (
                <div className="p-4 rounded-xl bg-[#5B0E14]/80 border border-[#f1e194] text-xs font-mono">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-bold text-[#f1e194] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#f1e194]" />
                        <span>Supabase me &apos;playlist&apos; table abhi nahi bani hai</span>
                      </div>
                      <p className="text-[#ffffff]/90 text-[11px] leading-relaxed">
                        Neeche diye gaye SQL script ko copy karein (columns: <strong>title, artist, youtube_id, category</strong>) aur Supabase SQL Editor me run karein.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSqlGuide(!showSqlGuide)}
                      className="px-3 py-1.5 bg-[#000000] text-[#f1e194] border border-[#f1e194] hover:bg-[#f1e194] hover:text-[#000000] rounded-lg transition-colors whitespace-nowrap text-[11px] font-bold"
                    >
                      {showSqlGuide ? 'SQL Chhupayein' : 'SQL Script Dekhein (1-Click)'}
                    </button>
                  </div>

                  {showSqlGuide && (
                    <div className="mt-3 pt-3 border-t border-[#f1e194]/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#f1e194]">
                          Complete Schema &amp; Policies Script:
                        </span>
                        <button
                          onClick={handleCopySql}
                          className="px-2.5 py-1 bg-[#5B0E14] text-[#ffffff] hover:text-[#f1e194] border border-[#f1e194]/50 rounded text-[10px] flex items-center gap-1 font-mono"
                        >
                          {copiedSql ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copy Ho Gaya!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>SQL Script Copy Karein</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-[#000000] border border-[#5B0E14] rounded-lg text-[10px] font-mono text-[#f1e194] overflow-x-auto selection:bg-[#5B0E14]">
                        {SUPABASE_SETUP_SQL}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: TRACKS MANAGEMENT */}
              {activeTab === 'tracks' && (
                <>
                  {/* Add New Song Section */}
                  <div className="bg-[#000000]/80 border border-[#5B0E14] rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-cinzel font-bold text-sm text-[#f1e194] flex items-center gap-2">
                        <Plus className="w-4 h-4 text-[#f1e194]" />
                        <span>NAYA GAANA LIST ME JODEIN</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#f1e194] bg-[#5B0E14]/40 px-2 py-0.5 rounded border border-[#5B0E14]">
                        Payload: &#123; title, artist, youtube_id, category &#125;
                      </span>
                    </div>

                    {/* Collapsible Bulk YouTube Playlist Import Section */}
                    <div className="mb-4 bg-gradient-to-r from-[#5B0E14]/30 via-[#000000]/90 to-[#5B0E14]/30 border border-[#5B0E14] hover:border-[#f1e194]/60 rounded-xl overflow-hidden transition-all shadow-md">
                      <button
                        type="button"
                        onClick={() => setIsBulkSectionOpen(!isBulkSectionOpen)}
                        className="w-full p-3 flex items-center justify-between text-xs font-mono text-left hover:bg-[#5B0E14]/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ListPlus className="w-4 h-4 text-[#f1e194] shrink-0" />
                          <span className="text-[#ffffff] font-bold">Bulk YouTube Playlist Import 🍕</span>
                          <span className="text-[10px] text-[#f1e194]/80 hidden sm:inline">(Poori playlist ek click me import karein)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#f1e194] text-[11px] font-bold">
                          <span>{isBulkSectionOpen ? 'Band Karein' : 'Kholein'}</span>
                          {isBulkSectionOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {isBulkSectionOpen && (
                        <div className="p-4 border-t border-[#5B0E14]/60 bg-[#000000]/70 space-y-3">
                          <div>
                            <label className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase">
                              YouTube Playlist Link *
                            </label>
                            <input
                              type="text"
                              placeholder="https://www.youtube.com/playlist?list=PL..."
                              value={bulkPlaylistUrl}
                              onChange={(e) => setBulkPlaylistUrl(e.target.value)}
                              className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <div>
                              <label className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase">
                                Target Playlist / Mood Category *
                              </label>
                              <select
                                value={isBulkCustomCategory ? '__CUSTOM__' : bulkCategory}
                                onChange={(e) => {
                                  if (e.target.value === '__CUSTOM__') {
                                    setIsBulkCustomCategory(true);
                                  } else {
                                    setIsBulkCustomCategory(false);
                                    setBulkCategory(e.target.value);
                                  }
                                }}
                                className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none"
                              >
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                                <option value="__CUSTOM__">+ Nayi Category Banayein...</option>
                              </select>
                            </div>

                            {isBulkCustomCategory && (
                              <div>
                                <input
                                  type="text"
                                  placeholder="Nayi category ka naam"
                                  value={bulkCustomCategory}
                                  onChange={(e) => setBulkCustomCategory(e.target.value)}
                                  className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none"
                                />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleBulkPlaylistImport(e as unknown as React.FormEvent)}
                            disabled={isBulkImporting || !bulkPlaylistUrl.trim()}
                            className="w-full py-2.5 bg-[#5B0E14] hover:bg-[#78131a] border border-[#f1e194] text-[#ffffff] font-cinzel font-bold text-xs rounded-xl transition-all shadow disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            {isBulkImporting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#f1e194]" />
                                <span>Import Ho Raha Hai...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-[#f1e194]" />
                                <span>Saare Gaane Is Playlist Me Jodein 🍕</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAddSong} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Song Title */}
                        <div>
                          <label className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase">
                            Gaane Ka Naam *
                          </label>
                          <input
                            type="text"
                            placeholder="Jaise: Pehla Nasha / Midnight Coffee"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none"
                          />
                        </div>

                        {/* Artist Name */}
                        <div>
                          <label className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase">
                            Artist / Singer Ka Naam
                          </label>
                          <input
                            type="text"
                            placeholder="Jaise: Udit Narayan / Lofi Fruits"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none"
                          />
                        </div>
                      </div>

                      {/* YouTube Video ID or Full Link with live parsing, auto-fill, and manual editing */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-mono text-[#f1e194] uppercase">
                            YouTube Video ID ya Full Link *
                          </label>
                          {extractedId && (
                            <button
                              type="button"
                              onClick={() => handleAutoFetchMeta(extractedId)}
                              disabled={isFetchingMeta}
                              className="text-[10px] font-mono text-[#f1e194] hover:text-[#ffffff] flex items-center gap-1 underline transition-colors disabled:opacity-50"
                            >
                              {isFetchingMeta ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-[#f1e194]" />
                                  <span>Metadata Fetching...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-[#f1e194]" />
                                  <span>Auto-Fetch Title &amp; Artist</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="11-char ID (jaise: dQw4w9WgXcQ) ya Poora YouTube Link"
                          value={youtubeUrl}
                          onChange={(e) => handleYoutubeInputChange(e.target.value)}
                          className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none"
                        />
                        <p className="text-[10px] text-[#ffffff]/60 font-mono mt-1">
                          Full URL paste karne par 11-akshar ka ID auto-fill hoga aur metadata fetch ho jayega. Aap is ID ko manually type ya edit bhi kar sakte hain.
                        </p>

                        {/* Parser Status Preview */}
                        {youtubeUrl.trim() && (
                          <div className="mt-2 flex items-center gap-3 p-2.5 bg-[#5B0E14]/20 border border-[#5B0E14] rounded-xl">
                            {extractedId ? (
                              <>
                                <img
                                  src={getYouTubeThumbnail(extractedId)}
                                  alt="Thumbnail preview"
                                  className="w-16 h-11 object-cover rounded-lg border border-[#f1e194]/40"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#f1e194]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Video ID:</span>
                                    <code className="bg-[#000000] px-1.5 py-0.5 rounded text-[#ffffff] font-bold border border-[#f1e194]/40">
                                      {extractedId}
                                    </code>
                                  </div>
                                  <p className="text-[10px] text-[#ffffff]/60 font-mono mt-0.5">
                                    {isFetchingMeta
                                      ? 'YouTube se metadata fetch ho raha hai...'
                                      : 'ID valid hai aur editable hai — Supabase me save hone ke liye ready.'}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-xs font-mono text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>11-akshar ka valid YouTube video ID nahi mil paya.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Category Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                          <label className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase">
                            Mood / Category Chunein *
                          </label>
                          <select
                            value={isCustomCategory ? '__CUSTOM__' : category}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                setIsCustomCategory(true);
                              } else {
                                setIsCustomCategory(false);
                                setCategory(e.target.value);
                              }
                            }}
                            className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none"
                          >
                            <option value="All">Sabhi Gaane (All)</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            <option value="__CUSTOM__">+ Nayi Category Banayein...</option>
                          </select>
                        </div>

                        {isCustomCategory && (
                          <div>
                            <label
                              htmlFor={customCatInputId}
                              className="block text-[11px] font-mono text-[#f1e194] mb-1 uppercase"
                            >
                              Nayi Category Ka Naam
                            </label>
                            <input
                              id={customCatInputId}
                              type="text"
                              placeholder="Jaise: 90s Ka Magic, Monsoon Beats..."
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#f1e194]/80">
                          Direct Supabase Sync &#123; title, artist, youtube_id, category &#125;
                        </span>

                        <button
                          type="submit"
                          disabled={isSubmitting || !extractedId || !title.trim()}
                          className="px-6 py-2.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] font-cinzel font-bold text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(91,14,20,0.5)] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 active:translate-y-0.5"
                        >
                          <Plus className="w-4 h-4 text-[#f1e194]" />
                          <span>
                            {isSubmitting
                              ? 'Playlist Me Add Ho Raha Hai...'
                              : 'Playlist Me Add Karein 🍕'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Manage Playlist Library Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-cinzel font-bold text-sm text-[#ffffff] flex items-center gap-2">
                          <span>SAVED PLAYLIST (SUPABASE CLOUD) ({songs.length} Gaane)</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </h3>
                        <p className="text-[11px] font-mono text-[#f1e194]/80">
                          {isTableMissing
                            ? 'Supabase table pending (backup lo-fi gaane active)'
                            : 'Live Cloud Database se synchronized'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={handleManualRefresh}
                          disabled={isRefreshing}
                          title="Database se dubara load karein"
                          className="px-3 py-1.5 bg-[#5B0E14]/40 hover:bg-[#5B0E14] text-[#f1e194] border border-[#5B0E14] rounded-lg text-xs font-mono flex items-center gap-1.5"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                          />
                          <span>Sync DB</span>
                        </button>

                        <button
                          onClick={handleSeedDatabase}
                          disabled={isSeeding}
                          title="Sample gaane categories ke saath database me load karein"
                          className="px-3 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194]/60 rounded-lg text-xs font-mono flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#f1e194]" />
                          <span>{isSeeding ? 'Save Ho Raha Hai...' : 'Sample Gaane Dalein'}</span>
                        </button>

                        <button
                          onClick={handleExportJson}
                          title="Playlist ko JSON me download karein"
                          className="px-3 py-1.5 bg-[#5B0E14]/40 hover:bg-[#5B0E14] text-[#f1e194] border border-[#5B0E14] rounded-lg text-xs font-mono flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>JSON</span>
                        </button>

                        <label className="px-3 py-1.5 bg-[#5B0E14]/40 hover:bg-[#5B0E14] text-[#f1e194] border border-[#5B0E14] rounded-lg text-xs font-mono flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJson}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Song Table / List View */}
                    {songs.length === 0 ? (
                      <div className="p-8 text-center bg-[#000000]/80 border border-dashed border-[#5B0E14] rounded-2xl">
                        <p className="text-sm font-cinzel text-[#f1e194] mb-2">
                          Abhi koi gaana nahi joda gaya hai. Pehla gaana upar se add karein!
                        </p>
                        <p className="text-xs font-mono text-[#ffffff]/60 mb-4">
                          Upar diye gaye form se naya YouTube link add karein ya sample playlist load karein.
                        </p>
                        <button
                          onClick={handleSeedDatabase}
                          className="px-4 py-2 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] rounded-xl text-xs font-mono inline-flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-[#f1e194]" />
                          <span>Sample Gaane Supabase Me Load Karein</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {songs.map((song, idx) => (
                          <div
                            key={song.id}
                            className="p-3 bg-[#000000]/80 border border-[#5B0E14] rounded-xl flex items-center justify-between gap-3 hover:border-[#f1e194] transition-colors"
                          >
                            {/* Left: Thumbnail & Info */}
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-xs text-[#f1e194] font-bold w-6 text-center shrink-0">
                                {(idx + 1).toString().padStart(2, '0')}
                              </span>

                              <img
                                src={getYouTubeThumbnail(song.youtubeId)}
                                alt={song.title}
                                className="w-12 h-9 object-cover rounded-md border border-[#5B0E14] shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />

                              <div className="min-w-0">
                                <div className="font-cinzel text-xs font-bold text-[#ffffff] truncate flex items-center gap-2">
                                  <span>{song.title}</span>
                                  {song.isDbRecord && (
                                    <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.2 rounded shrink-0">
                                      SUPABASE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#f1e194]/85 font-mono truncate">
                                  {song.artist}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-[#ffffff]/60 mt-0.5">
                                  <span className="text-[#f1e194] bg-[#5B0E14]/40 px-1.5 py-0.5 rounded border border-[#5B0E14]">
                                    {song.category || 'All'}
                                  </span>
                                  <span>·</span>
                                  <code>ID: {song.youtubeId}</code>
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => onPlaySong(song)}
                                title="Play Karein"
                                className="px-3 py-1.5 bg-[#5B0E14]/40 hover:bg-[#f1e194] hover:text-[#000000] text-[#f1e194] border border-[#5B0E14] rounded-lg transition-colors text-xs font-mono flex items-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play Karein</span>
                              </button>
                              <button
                                onClick={() => setSongToDelete(song)}
                                title="Hatao"
                                className="px-2.5 py-1.5 bg-[#5B0E14]/40 hover:bg-red-900 text-red-300 border border-[#5B0E14] hover:border-red-500 rounded-lg transition-colors text-xs font-mono flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hatao 🗑️</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: CATEGORIES MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  {/* Create New Category Form */}
                  <div className="bg-[#000000]/80 border border-[#5B0E14] rounded-2xl p-5 shadow-inner">
                    <h3 className="font-cinzel font-bold text-sm text-[#f1e194] flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-[#f1e194]" />
                      <span>MOOD &amp; CATEGORY MANAGEMENT</span>
                    </h3>

                    <form onSubmit={handleAddDirectCategory} className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={directCatInputId} className="sr-only">
                          Category Ka Naam
                        </label>
                        <input
                          id={directCatInputId}
                          type="text"
                          placeholder="Jaise: 90s Ka Magic, Late Night Lo-Fi, Cafe Vibes..."
                          value={newDirectCategory}
                          onChange={(e) => setNewDirectCategory(e.target.value)}
                          className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newDirectCategory.trim()}
                        className="px-5 py-2.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] font-cinzel font-bold text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(91,14,20,0.5)] disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 active:translate-y-0.5"
                      >
                        <Plus className="w-4 h-4 text-[#f1e194]" />
                        <span>Category Add Karein</span>
                      </button>
                    </form>
                  </div>

                  {/* List of Existing Categories */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-cinzel font-bold text-sm text-[#ffffff] flex items-center gap-2">
                          <span>MOOD &amp; ACTIVE CATEGORIES ({categories.length})</span>
                        </h4>
                        <p className="text-[11px] font-mono text-[#f1e194]/80">
                          Playlist ke gaano aur filter chips ke saath synchronized
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Default "All" Root Category (Protected) */}
                      <div className="p-3.5 bg-[#000000]/80 border border-[#5B0E14]/60 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#5B0E14]/50 border border-[#f1e194]/30 flex items-center justify-center text-[#f1e194]">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono text-xs font-bold text-[#ffffff] flex items-center gap-2">
                              <span>Sabhi Gaane (All)</span>
                              <span className="text-[9px] bg-[#5B0E14] text-[#f1e194] px-1.5 py-0.5 rounded font-mono">
                                Default Master Category
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#ffffff]/60 mt-0.5">
                              Poore collection ke sabhi {songs.length} gaane shamil hain
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#f1e194]/70 px-2.5 py-1 bg-[#5B0E14]/20 rounded-lg border border-[#5B0E14]/40">
                          Primary Tag
                        </span>
                      </div>

                      {/* Custom Categories */}
                      {categories.map((cat) => {
                        const trackCount = songs.filter((s) => s.category === cat).length;
                        return (
                          <div
                            key={cat}
                            className="p-3.5 bg-[#000000]/80 border border-[#5B0E14] hover:border-[#f1e194] rounded-xl flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#5B0E14] border border-[#f1e194]/40 flex items-center justify-center text-[#f1e194]">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-mono text-xs font-bold text-[#f1e194]">
                                  {cat}
                                </div>
                                <div className="text-[11px] font-mono text-[#ffffff]/60 mt-0.5">
                                  {trackCount} {trackCount === 1 ? 'gaana juda hua' : 'gaane jude hue'}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => setCategoryToDelete(cat)}
                              title={`Category "${cat}" delete karein`}
                              className="px-3 py-1.5 bg-[#5B0E14]/40 hover:bg-red-900 text-red-300 border border-[#5B0E14] hover:border-red-500 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hatao 🗑️</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BULK YOUTUBE PLAYLIST IMPORT */}
              {activeTab === 'bulk-import' && (
                <div className="space-y-6">
                  <div className="bg-[#000000]/80 border border-[#5B0E14] rounded-2xl p-5 sm:p-6 shadow-inner space-y-5">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#5B0E14]">
                      <div>
                        <h3 className="font-cinzel font-bold text-base text-[#f1e194] flex items-center gap-2">
                          <ListPlus className="w-5 h-5 text-[#f1e194]" />
                          <span>BULK YOUTUBE PLAYLIST IMPORT</span>
                        </h3>
                        <p className="text-xs font-mono text-[#ffffff]/70 mt-1">
                          YouTube playlist ke sabhi gaane automatic song name aur artist extraction ke saath Supabase me ek click me import karein.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-[#5B0E14]/40 px-2.5 py-1 rounded border border-[#5B0E14] shrink-0 font-bold">
                        CORS XML Scraper
                      </span>
                    </div>

                    <form onSubmit={handleBulkPlaylistImport} className="space-y-4">
                      {/* Input 1: YouTube Playlist Link */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={bulkPlaylistInputId}
                          className="block text-xs font-mono font-bold tracking-wider text-[#f1e194] uppercase"
                        >
                          YouTube Playlist Link *
                        </label>
                        <input
                          id={bulkPlaylistInputId}
                          type="text"
                          required
                          value={bulkPlaylistUrl}
                          onChange={(e) => setBulkPlaylistUrl(e.target.value)}
                          placeholder="https://www.youtube.com/playlist?list=PL..."
                          disabled={isBulkImporting}
                          className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] placeholder:text-[#ffffff]/40 outline-none disabled:opacity-50"
                        />
                        <p className="text-[10px] font-mono text-[#ffffff]/50">
                          Playlist URL paste karein (e.g. <code>https://www.youtube.com/playlist?list=PL...</code> ya <code>https://youtu.be/...&amp;list=...</code>)
                        </p>
                      </div>

                      {/* Input 2: Target Playlist / Mood Category */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor={bulkCategorySelectId}
                          className="block text-xs font-mono font-bold tracking-wider text-[#f1e194] uppercase"
                        >
                          Target Playlist / Mood Category *
                        </label>
                        <select
                          id={bulkCategorySelectId}
                          value={isBulkCustomCategory ? '__custom__' : bulkCategory}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setIsBulkCustomCategory(true);
                            } else {
                              setIsBulkCustomCategory(false);
                              setBulkCategory(e.target.value);
                            }
                          }}
                          disabled={isBulkImporting}
                          className="w-full bg-[#000000] border border-[#5B0E14] focus:border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#ffffff] outline-none disabled:opacity-50"
                        >
                          {Array.from(
                            new Set([
                              '90s Ka Magic',
                              'Late Night Lo-Fi',
                              'Cafe Vibes',
                              'Sunday Special',
                              'Trending Hits',
                              ...categories.filter((c) => Boolean(c) && c !== 'All'),
                            ])
                          ).map((cat) => (
                            <option key={cat} value={cat} className="bg-[#000000] text-[#ffffff]">
                              {cat}
                            </option>
                          ))}
                          <option value="__custom__" className="bg-[#5B0E14] text-[#f1e194] font-bold">
                            + Nayi Category Banayein
                          </option>
                        </select>

                        {/* Custom Category Input if selected */}
                        {isBulkCustomCategory && (
                          <div className="pt-2 animate-in fade-in duration-200">
                            <label htmlFor={bulkCustomCatInputId} className="sr-only">
                              Nayi Category Ka Naam
                            </label>
                            <input
                              id={bulkCustomCatInputId}
                              type="text"
                              required={isBulkCustomCategory}
                              value={bulkCustomCategory}
                              onChange={(e) => setBulkCustomCategory(e.target.value)}
                              placeholder="Nayi category ka naam dalein (e.g. 2000s Bollywood / Indie Acoustic)..."
                              disabled={isBulkImporting}
                              className="w-full bg-[#000000] border-2 border-[#f1e194] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#f1e194] placeholder:text-[#ffffff]/40 outline-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Live Status Box */}
                      {(isBulkImporting || bulkStatusText) && (
                        <div className="p-4 bg-[#000000] border border-[#5B0E14] rounded-xl font-mono text-xs text-[#f1e194] space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-[#ffffff]">
                              {isBulkImporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f1e194]" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>Live Status:</span>
                            </div>
                            {bulkExtractedCount > 0 && (
                              <span className="text-[10px] text-[#f1e194] bg-[#5B0E14]/50 px-2 py-0.5 rounded border border-[#5B0E14]">
                                {bulkExtractedCount} gaane detect hue
                              </span>
                            )}
                          </div>
                          <div className="p-2.5 bg-[#5B0E14]/25 rounded-lg border border-[#5B0E14]/40 text-[11px] text-[#ffffff] break-all leading-relaxed">
                            {bulkStatusText}
                          </div>
                          {bulkExtractedPreview.length > 0 && (
                            <div className="pt-2 border-t border-[#5B0E14]/40">
                              <span className="text-[10px] text-[#ffffff]/60 block mb-1.5 font-bold uppercase tracking-wider">
                                Extracted Sample ({bulkExtractedPreview.length}):
                              </span>
                              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[10px]">
                                {bulkExtractedPreview.map((s, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 py-1 px-2 bg-[#000000]/60 rounded border border-[#5B0E14]/30"
                                  >
                                    <div className="truncate text-[#ffffff] flex items-center gap-1.5">
                                      <span className="text-[#f1e194] font-bold">{idx + 1}.</span>
                                      <span className="truncate">{s.title}</span>
                                    </div>
                                    <span className="shrink-0 text-[#f1e194]/80 font-mono">
                                      {s.artist}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Button */}
                      <button
                        type="submit"
                        disabled={isBulkImporting || !bulkPlaylistUrl.trim()}
                        className="w-full py-3 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194] font-cinzel font-bold text-xs tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(91,14,20,0.6)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 active:translate-y-0.5"
                      >
                        {isBulkImporting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#f1e194]" />
                            <span>Saare Gaane Process Ho Rahe Hain...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-[#f1e194]" />
                            <span>Saare Gaane Is Playlist Me Jodein 🍕</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Staff PIN Management */}
              <div className="p-4 bg-[#000000]/90 border border-[#5B0E14] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono font-bold text-[#f1e194]">
                    Kitchen Staff PIN Security
                  </div>
                  <div className="text-[11px] font-mono text-[#ffffff]/70">
                    Current PIN:{' '}
                    <code className="text-[#ffffff] bg-[#5B0E14] px-1.5 py-0.5 rounded">
                      {currentPin}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newPin = prompt(
                      'Kitchen access ke liye naya 4-digit PIN dalein:',
                      currentPin
                    );
                    if (newPin && newPin.trim().length >= 4) {
                      localStorage.setItem('hpz_admin_pin', newPin.trim());
                      setCurrentPin(newPin.trim());
                      alert(`PIN successfully update hokar ${newPin.trim()} set ho gaya!`);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] border border-[#f1e194]/50 rounded-lg text-xs font-mono"
                >
                  PIN Badlein
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Track Confirmation Dialog */}
        {songToDelete && (
          <div className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-[#000000] border-2 border-red-600 rounded-2xl p-5 max-w-sm w-full text-center shadow-2xl">
              <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <h4 className="font-cinzel font-bold text-[#ffffff] text-sm mb-1">
                Gaana Supabase Se Hatayein?
              </h4>
              <p className="text-xs font-mono text-[#ffffff]/80 mb-4">
                Kya aap sach me &ldquo;{songToDelete.title}&rdquo; ko Supabase playlist se hatana chahte hain?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setSongToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-1.5 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] rounded-lg text-xs font-mono"
                >
                  Radd Karein
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  disabled={isDeleting}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono font-bold shadow flex items-center gap-1.5"
                >
                  {isDeleting ? 'Hata Raha Hai...' : 'Hatao 🗑️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Dialog */}
        {categoryToDelete && (
          <div className="absolute inset-0 bg-[#000000]/85 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-[#000000] border-2 border-[#5B0E14] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cinzel font-bold text-[#ffffff] text-sm">
                    Category &ldquo;{categoryToDelete}&rdquo; Delete Karein?
                  </h4>
                  <p className="text-xs font-mono text-[#f1e194]/80">
                    Chunein ki is category ke gaano ka kya karna hai:
                  </p>
                </div>
              </div>

              {/* Action Choice Radio Cards */}
              <div className="space-y-2 text-xs font-mono">
                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    categoryDeleteAction === 'reassign_to_all'
                      ? 'bg-[#5B0E14]/40 border-[#f1e194] text-[#ffffff]'
                      : 'bg-[#000000] border-[#5B0E14] text-[#ffffff]/70 hover:border-[#f1e194]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cat_action"
                    checked={categoryDeleteAction === 'reassign_to_all'}
                    onChange={() => setCategoryDeleteAction('reassign_to_all')}
                    className="mt-0.5 accent-[#f1e194]"
                  />
                  <div>
                    <div className="font-bold text-[#f1e194] flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Gaane &apos;Sabhi Gaane&apos; (All) me bhej dein (Recommended)</span>
                    </div>
                    <p className="text-[11px] text-[#ffffff]/70 mt-0.5">
                      Yeh gaane Supabase me rahenge, bas inki category &apos;All&apos; ho jayegi.
                    </p>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    categoryDeleteAction === 'delete_tracks'
                      ? 'bg-red-950/40 border-red-500 text-[#ffffff]'
                      : 'bg-[#000000] border-[#5B0E14] text-[#ffffff]/70 hover:border-red-500/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cat_action"
                    checked={categoryDeleteAction === 'delete_tracks'}
                    onChange={() => setCategoryDeleteAction('delete_tracks')}
                    className="mt-0.5 accent-red-500"
                  />
                  <div>
                    <div className="font-bold text-red-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Is category ke sabhi gaane bhi delete kar dein</span>
                    </div>
                    <p className="text-[11px] text-[#ffffff]/70 mt-0.5">
                      Is category ke sabhi gaane Supabase se hamesha ke liye delete ho jayenge.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setCategoryToDelete(null)}
                  disabled={isDeletingCategory}
                  className="px-4 py-2 bg-[#5B0E14] hover:bg-[#78131a] text-[#ffffff] rounded-xl text-xs font-mono"
                >
                  Radd Karein
                </button>
                <button
                  onClick={handleConfirmDeleteCategory}
                  disabled={isDeletingCategory}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold shadow flex items-center gap-2"
                >
                  {isDeletingCategory ? 'Delete Ho Raha Hai...' : 'Category Delete Karein'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
