const PLATFORM_MAP: Record<string, string> = {
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'm.youtube.com': 'YouTube',
  'coursera.org': 'Coursera',
  'udemy.com': 'Udemy',
  'wistia.com': 'Wistia',
  'wistia.net': 'Wistia',
  'panopto.com': 'Panopto',
  'loom.com': 'Loom',
  'vimeo.com': 'Vimeo',
  'kaltura.com': 'Kaltura',
  'brightcove.com': 'Brightcove',
  'mediaspace.kaltura.com': 'Kaltura',
  'netflix.com': 'Netflix',
  'primevideo.com': 'Amazon Prime',
  'amazon.com': 'Amazon Prime',
  'hulu.com': 'Hulu',
  'disneyplus.com': 'Disney+',
  'max.com': 'Max',
  'hbomax.com': 'Max',
  'peacocktv.com': 'Peacock',
  'paramountplus.com': 'Paramount+',
  'tv.apple.com': 'Apple TV+',
};

const CANVAS_PATTERN = /(^|\.)canvas\.[\w.-]+\.edu$/i;
const BLACKBOARD_PATTERN = /(^|\.)blackboard\.com$/i;

function detectPlatformFromCdn(hostname: string): string | null {
  if (/dssott\.com|starott\.com/i.test(hostname)) return 'Disney+';
  if (/warnermediacdn\.com|h264\.io/i.test(hostname)) return 'Max';
  if (/media\.max\.com/i.test(hostname)) return 'Max';
  if (/huluim\.com/i.test(hostname)) return 'Hulu';
  if (/pv-cdn\.net|aiv-prod-timedtext/i.test(hostname)) return 'Amazon Prime';
  if (/cbsaavideo\.com/i.test(hostname)) return 'Paramount+';
  if (/amt\.tv\.apple\.com/i.test(hostname)) return 'Apple TV+';
  if (/nflxvideo\.net/i.test(hostname)) return 'Netflix';
  return null;
}

export function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    const cdnPlatform = detectPlatformFromCdn(hostname);
    if (cdnPlatform) return cdnPlatform;

    if (CANVAS_PATTERN.test(hostname)) {
      return 'Canvas LMS';
    }

    if (BLACKBOARD_PATTERN.test(hostname)) {
      return 'Blackboard';
    }

    if (PLATFORM_MAP[hostname]) {
      return PLATFORM_MAP[hostname];
    }

    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const base = parts.slice(-2).join('.');
      if (PLATFORM_MAP[base]) {
        return PLATFORM_MAP[base];
      }
    }

    return hostname;
  } catch {
    return 'unknown';
  }
}

export function truncateUrl(url: string, maxLength = 56): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength - 1)}…`;
}
