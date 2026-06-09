import type { CueBlock } from '../../types';

interface Json3Seg {
  utf8?: string;
}

interface Json3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Json3Seg[];
}

interface Json3Payload {
  events?: Json3Event[];
}

export function parseJson3(raw: string): CueBlock[] {
  let parsed: Json3Payload;

  try {
    parsed = JSON.parse(raw) as Json3Payload;
  } catch {
    return [];
  }

  if (!Array.isArray(parsed.events)) return [];

  const cues: CueBlock[] = [];

  for (const event of parsed.events) {
    if (event.tStartMs === undefined || !event.segs?.length) continue;

    const text = event.segs
      .map((seg) => seg.utf8 ?? '')
      .join('')
      .replace(/\n/g, ' ')
      .trim();

    if (!text || text === '\n') continue;

    const start = event.tStartMs / 1000;
    const duration = event.dDurationMs ?? 0;
    const end = duration > 0 ? start + duration / 1000 : start + 0.001;

    cues.push({ start, end, text });
  }

  return cues;
}
