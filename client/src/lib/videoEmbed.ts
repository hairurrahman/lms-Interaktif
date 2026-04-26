// Auto-detect video source dan convert ke URL embed yang cocok.
// Dukungan: YouTube, Google Drive, Vimeo, MP4 langsung.

export type VideoKind = 'youtube' | 'drive' | 'vimeo' | 'mp4' | 'iframe' | 'unknown';

export interface EmbedInfo {
  kind: VideoKind;
  embedUrl: string;
  isIframe: boolean; // true: pakai <iframe>, false: pakai <video>
  originalUrl: string;
}

function extractYouTubeId(url: string): string | null {
  // Tangani: youtube.com/watch?v=X, youtu.be/X, youtube.com/embed/X, youtube.com/shorts/X
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractDriveId(url: string): string | null {
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  const p1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (p1) return p1[1];
  const p2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (p2) return p2[1];
  return null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function convertToEmbed(url: string): EmbedInfo {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { kind: 'unknown', embedUrl: '', isIframe: true, originalUrl: '' };
  }

  // YouTube
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return {
      kind: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      isIframe: true,
      originalUrl: trimmed,
    };
  }

  // Google Drive
  const driveId = extractDriveId(trimmed);
  if (driveId) {
    return {
      kind: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      isIframe: true,
      originalUrl: trimmed,
    };
  }

  // Vimeo
  const vimeoId = extractVimeoId(trimmed);
  if (vimeoId) {
    return {
      kind: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      isIframe: true,
      originalUrl: trimmed,
    };
  }

  // Direct MP4 / WebM / OGG
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return { kind: 'mp4', embedUrl: trimmed, isIframe: false, originalUrl: trimmed };
  }

  // Sudah berupa URL embed (iframe-friendly)
  if (/\/(embed|preview|player)\//i.test(trimmed)) {
    return { kind: 'iframe', embedUrl: trimmed, isIframe: true, originalUrl: trimmed };
  }

  // Default: coba pasang sebagai iframe
  return { kind: 'unknown', embedUrl: trimmed, isIframe: true, originalUrl: trimmed };
}

export function getVideoKindLabel(kind: VideoKind): string {
  switch (kind) {
    case 'youtube': return 'YouTube';
    case 'drive': return 'Google Drive';
    case 'vimeo': return 'Vimeo';
    case 'mp4': return 'Video MP4';
    case 'iframe': return 'Embed';
    default: return 'Video';
  }
}
