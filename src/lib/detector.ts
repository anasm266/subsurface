import type { DetectorResult, SubtitleFormat } from '../types';

const EXTENSION_PATTERN =
  /\.(vtt|srt|ttml|ttml2|dfxp|ass|ssa|sbv|sub|xml|json3)([\?#]|$)/i;

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; format: SubtitleFormat }> = [
  { pattern: /\/api\/timedtext/i, format: 'vtt' },
  { pattern: /\/timedtext/i, format: 'vtt' },
  { pattern: /\/caption/i, format: 'vtt' },
  { pattern: /\/subtitles?/i, format: 'vtt' },
  { pattern: /\/transcript/i, format: 'vtt' },
  { pattern: /\/closed-captions/i, format: 'vtt' },
  { pattern: /wistia\.(com|net).*\.(vtt|srt|ttml)/i, format: 'vtt' },
  { pattern: /panopto\.com.*caption/i, format: 'vtt' },
  { pattern: /nflxvideo\.net/i, format: 'ttml' },
  { pattern: /timedtexttracks/i, format: 'ttml' },
  { pattern: /dssott\.com/i, format: 'vtt' },
  { pattern: /starott\.com/i, format: 'vtt' },
  { pattern: /warnermediacdn\.com/i, format: 'vtt' },
  { pattern: /h264\.io/i, format: 'vtt' },
  { pattern: /media\.max\.com/i, format: 'vtt' },
  { pattern: /akamaihd\.net.*caption/i, format: 'vtt' },
  { pattern: /huluim\.com/i, format: 'vtt' },
  { pattern: /pv-cdn\.net/i, format: 'ttml' },
  { pattern: /aiv-prod-timedtext/i, format: 'ttml' },
  { pattern: /cloudfront\.net.*timedtext/i, format: 'ttml' },
  { pattern: /\.ttml2(\?|$)/i, format: 'ttml' },
  { pattern: /cbsaavideo\.com/i, format: 'vtt' },
  { pattern: /amt\.tv\.apple\.com/i, format: 'vtt' },
];

const DATA_URI_PATTERN = /^data:(text\/(vtt|srt|plain)|application\/ttml)/i;

function detectFormatFromUrl(url: string): SubtitleFormat | null {
  try {
    const parsed = new URL(url, 'https://example.com');
    const fmt = parsed.searchParams.get('fmt');
    if (fmt === 'json3') return 'json3';
  } catch {
    // ignore invalid urls
  }

  const extensionMatch = url.match(EXTENSION_PATTERN);
  if (extensionMatch) {
    const ext = extensionMatch[1].toLowerCase();
    if (ext === 'dfxp' || ext === 'ttml2') return 'ttml';
    if (ext === 'json3') return 'json3';
    if (ext === 'xml') return 'ttml';
    return ext as SubtitleFormat;
  }

  for (const { pattern, format } of PLATFORM_PATTERNS) {
    if (pattern.test(url)) return format;
  }

  if (DATA_URI_PATTERN.test(url)) {
    if (/ttml|dfxp/i.test(url)) return 'ttml';
    if (/srt/i.test(url)) return 'srt';
    return 'vtt';
  }

  return null;
}

function detectLanguage(url: string): string {
  try {
    const parsed = new URL(url, 'https://example.com');
    const params = parsed.searchParams;

    const candidates = [
      params.get('lang'),
      params.get('language'),
      params.get('tlang'),
      params.get('hl'),
      params.get('locale'),
    ].filter(Boolean) as string[];

    if (candidates.length > 0) {
      return candidates[0].slice(0, 5).toLowerCase();
    }

    const pathMatch = parsed.pathname.match(/(?:^|[/_-])([a-z]{2}(?:-[a-z]{2})?)(?:[._/-]|$)/i);
    if (pathMatch) {
      return pathMatch[1].toLowerCase();
    }
  } catch {
    // ignore invalid urls
  }

  return 'unknown';
}

export function detectSubtitleUrl(url: string): DetectorResult {
  const format = detectFormatFromUrl(url);
  return {
    isSubtitle: format !== null,
    format,
    language: format ? detectLanguage(url) : 'unknown',
  };
}

export function isSubtitleUrl(url: string): boolean {
  return detectSubtitleUrl(url).isSubtitle;
}

export function looksLikeSubtitleContent(raw: string): boolean {
  const sample = raw.replace(/^\uFEFF/, '').trim().slice(0, 8192);
  if (sample.length < 8) return false;
  if (/^\s*\{"events"\s*:\s*\[/.test(sample)) return true;
  if (sample.startsWith('WEBVTT')) return true;
  if (/<tt\b/i.test(sample) && /<p\b[^>]*\bbegin=/i.test(sample)) return true;
  if (/<tt\b[\s\S]*xmlns[^>]*ttml/i.test(sample)) return true;
  if (/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->/m.test(sample)) return true;
  return false;
}

export function shouldInspectResponse(url: string, contentType = ''): boolean {
  if (isSubtitleUrl(url)) return true;

  const type = contentType.toLowerCase();
  if (/(xml|vtt|ttml|dfxp|timedtext|json)/i.test(type)) return true;

  if (/nflxvideo\.net/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm)/i.test(type);
  }

  if (/pv-cdn\.net|aiv-prod-timedtext/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm|mp3|aac)/i.test(type);
  }

  if (/dssott\.com|starott\.com/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm|mp3|aac)/i.test(type);
  }

  if (/warnermediacdn\.com|h264\.io|media\.max\.com/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm|mp3|aac)/i.test(type);
  }

  if (/huluim\.com/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm)/i.test(type);
  }

  if (/cbsaavideo\.com/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm|mp3|aac)/i.test(type);
  }

  if (/amt\.tv\.apple\.com/i.test(url)) {
    return !/(video|mp4|mpeg|octet-stream|dash|mp2t|webm|mp3|aac)/i.test(type);
  }

  return false;
}

export function normalizeCaptureUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const lang =
      parsed.searchParams.get('lang') ??
      parsed.searchParams.get('language') ??
      parsed.searchParams.get('tlang') ??
      parsed.searchParams.get('hl') ??
      '';
    const trackVersion = parsed.searchParams.get('v') ?? '';

    parsed.search = '';
    parsed.hash = '';
    const base = parsed.toString();
    const params = new URLSearchParams();
    if (lang) params.set('lang', lang);
    if (trackVersion) params.set('v', trackVersion);
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

export async function hashCaptureId(url: string, format: SubtitleFormat): Promise<string> {
  const normalized = `${normalizeCaptureUrl(url)}:${format}`;
  const encoded = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-1', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function inferFormatFromContent(raw: string): SubtitleFormat {
  const trimmed = raw.replace(/^\uFEFF/, '').trim();
  if (/^\s*\{"events"\s*:\s*\[/.test(trimmed)) return 'json3';
  if (trimmed.startsWith('WEBVTT')) return 'vtt';
  if (/<tt\b/i.test(trimmed) || /<p\b[^>]*begin=/i.test(trimmed)) return 'ttml';
  if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->/m.test(trimmed)) return 'srt';
  return 'vtt';
}

export function isSegmentedSubtitleUrl(url: string): boolean {
  return /dssott\.com|starott\.com|h264\.io|media\.max\.com|huluim\.com/i.test(url);
}
