import type { CueBlock } from '../../types';

const DEFAULT_TICK_RATE = 10_000_000;

function parseClock(value: string): number {
  const match = value.match(/(\d+):(\d{2}):(\d{2})(?:[.:](\d+))?/);
  if (!match) return 0;

  const [, hours, minutes, seconds, fraction = '0'] = match;
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(fraction.padEnd(3, '0').slice(0, 3)) / 1000
  );
}

function parseTtmlTime(value: string, tickRate: number): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  if (/t$/i.test(trimmed)) {
    const ticks = Number(trimmed.slice(0, -1));
    if (Number.isFinite(ticks)) {
      return ticks / tickRate;
    }
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return parseClock(trimmed);
}

function readTickRate(raw: string): number {
  const match = raw.match(/tickRate="(\d+)"/i);
  if (match) {
    const rate = Number(match[1]);
    if (Number.isFinite(rate) && rate > 0) return rate;
  }
  return DEFAULT_TICK_RATE;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function extractAttr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'));
  return match?.[1] ?? null;
}

function parseNodes(raw: string, tag: 'p' | 'span', tickRate: number): CueBlock[] {
  const cues: CueBlock[] = [];
  const pattern = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');

  let match = pattern.exec(raw);
  while (match) {
    const [, attrs, inner] = match;
    const begin = extractAttr(attrs, 'begin');
    const end = extractAttr(attrs, 'end');
    const text = stripTags(inner);

    if (begin && text) {
      cues.push({
        start: parseTtmlTime(begin, tickRate),
        end: end ? parseTtmlTime(end, tickRate) : parseTtmlTime(begin, tickRate) + 2,
        text,
      });
    }

    match = pattern.exec(raw);
  }

  return cues;
}

export function parseTtml(raw: string): CueBlock[] {
  const tickRate = readTickRate(raw);
  const paragraphCues = parseNodes(raw, 'p', tickRate);
  if (paragraphCues.length > 0) return paragraphCues;
  return parseNodes(raw, 'span', tickRate);
}
