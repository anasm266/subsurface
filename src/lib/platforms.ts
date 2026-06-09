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
};

const CANVAS_PATTERN = /(^|\.)canvas\.[\w.-]+\.edu$/i;
const BLACKBOARD_PATTERN = /(^|\.)blackboard\.com$/i;

export function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');

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
