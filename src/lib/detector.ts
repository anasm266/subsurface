import type { DetectorResult, SubtitleFormat } from '../types';

const EXTENSION_PATTERN = /\.(vtt|srt|ttml|dfxp)(\?|#|$)/i;

const PLATFORM_PATTERNS: Array<{ pattern: RegExp; format: SubtitleFormat }> = [
  { pattern: /\/api\/timedtext/i, format: 'vtt' },
  { pattern: /\/timedtext/i, format: 'vtt' },
  { pattern: /\/caption/i, format: 'vtt' },
  { pattern: /\/subtitles?/i, format: 'vtt' },
  { pattern: /\/transcript/i, format: 'vtt' },
  { pattern: /\/closed-captions/i, format: 'vtt' },
  { pattern: /wistia\.(com|net).*\.(vtt|srt|ttml)/i, format: 'vtt' },
  { pattern: /panopto\.com.*caption/i, format: 'vtt' },
];

const DATA_URI_PATTERN = /^data:(text\/(vtt|srt|plain)|application\/ttml)/i;

function detectFormatFromUrl(url: string): SubtitleFormat | null {
  const extensionMatch = url.match(EXTENSION_PATTERN);
  if (extensionMatch) {
    const ext = extensionMatch[1].toLowerCase();
    if (ext === 'dfxp') return 'ttml';
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

export function normalizeCaptureUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const lang =
      parsed.searchParams.get('lang') ??
      parsed.searchParams.get('language') ??
      parsed.searchParams.get('tlang') ??
      parsed.searchParams.get('hl') ??
      '';

    parsed.search = '';
    parsed.hash = '';
    const base = parsed.toString();
    return lang ? `${base}?lang=${lang}` : base;
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
  if (trimmed.startsWith('WEBVTT')) return 'vtt';
  if (/<tt\b/i.test(trimmed) || /<p\b[^>]*begin=/i.test(trimmed)) return 'ttml';
  if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->/m.test(trimmed)) return 'srt';
  return 'vtt';
}
