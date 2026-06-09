import type { CueBlock } from '../../types';

function parseClock(value: string): number {
  const match = value.match(/(\d+):(\d{2}):(\d{2})(?:\.(\d+))?/);
  if (!match) return 0;

  const [, hours, minutes, seconds, fraction = '0'] = match;
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(fraction.padEnd(3, '0').slice(0, 3)) / 1000
  );
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function parseTtml(raw: string): CueBlock[] {
  const cues: CueBlock[] = [];
  const paragraphPattern =
    /<p\b[^>]*\bbegin="([^"]+)"[^>]*\bend="([^"]+)"[^>]*>([\s\S]*?)<\/p>/gi;

  let match = paragraphPattern.exec(raw);
  while (match) {
    const [, begin, end, inner] = match;
    const text = stripTags(inner);
    if (text) {
      cues.push({
        start: parseClock(begin),
        end: parseClock(end) || parseClock(begin) + 2,
        text,
      });
    }
    match = paragraphPattern.exec(raw);
  }

  if (cues.length > 0) {
    return cues;
  }

  const spanPattern =
    /<span\b[^>]*\bbegin="([^"]+)"[^>]*\bend="([^"]+)"[^>]*>([\s\S]*?)<\/span>/gi;
  match = spanPattern.exec(raw);
  while (match) {
    const [, begin, end, inner] = match;
    const text = stripTags(inner);
    if (text) {
      cues.push({
        start: parseClock(begin),
        end: parseClock(end) || parseClock(begin) + 2,
        text,
      });
    }
    match = spanPattern.exec(raw);
  }

  return cues;
}
