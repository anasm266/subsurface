import type { CueBlock } from '../../types';

function parseTimestamp(value: string): number {
  const [timePart, msPart = '0'] = value.trim().replace(',', '.').split('.');
  const segments = timePart.split(':').map(Number);

  if (segments.length === 3) {
    const [hours, minutes, seconds] = segments;
    return hours * 3600 + minutes * 60 + seconds + Number(msPart.padEnd(3, '0').slice(0, 3)) / 1000;
  }

  if (segments.length === 2) {
    const [minutes, seconds] = segments;
    return minutes * 60 + seconds + Number(msPart.padEnd(3, '0').slice(0, 3)) / 1000;
  }

  return 0;
}

export function parseSrt(raw: string): CueBlock[] {
  const normalized = raw.replace(/^\uFEFF/, '').trim();
  const blocks = normalized.split(/\n\s*\n/);
  const cues: CueBlock[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const timingLine = lines.find((line) => line.includes('-->'));
    if (!timingLine) continue;

    const [startRaw, endRaw] = timingLine.split('-->').map((part) => part.trim());
    const timingIndex = lines.indexOf(timingLine);
    const text = lines.slice(timingIndex + 1).join('\n').trim();
    if (!text) continue;

    cues.push({
      start: parseTimestamp(startRaw),
      end: parseTimestamp(endRaw),
      text,
    });
  }

  return cues;
}
