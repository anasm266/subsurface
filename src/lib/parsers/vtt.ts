import type { CueBlock } from '../../types';

function parseTimestamp(value: string): number {
  const trimmed = value.trim();
  const parts = trimmed.split(':');

  if (parts.length === 3) {
    const [hours, minutes, secondsPart] = parts;
    const [seconds, ms = '0'] = secondsPart.split('.');
    return (
      Number(hours) * 3600 +
      Number(minutes) * 60 +
      Number(seconds) +
      Number(ms.padEnd(3, '0').slice(0, 3)) / 1000
    );
  }

  if (parts.length === 2) {
    const [minutes, secondsPart] = parts;
    const [seconds, ms = '0'] = secondsPart.split('.');
    return Number(minutes) * 60 + Number(seconds) + Number(ms.padEnd(3, '0').slice(0, 3)) / 1000;
  }

  return 0;
}

function parseCueTiming(line: string): { start: number; end: number } | null {
  const match = line.match(
    /(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}/,
  );
  if (!match) return null;

  const [startRaw, endRaw] = line.split('-->').map((part) => part.trim());
  return {
    start: parseTimestamp(startRaw.replace(',', '.')),
    end: parseTimestamp(endRaw.replace(',', '.')),
  };
}

export function parseVtt(raw: string): CueBlock[] {
  const normalized = raw.replace(/^\uFEFF/, '').trim();
  if (!normalized.toUpperCase().startsWith('WEBVTT')) {
    return [];
  }

  const blocks = normalized.split(/\n\s*\n/);
  const cues: CueBlock[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let timingIndex = 0;
    if (!lines[0].includes('-->')) {
      timingIndex = 1;
    }

    const timingLine = lines[timingIndex];
    if (!timingLine?.includes('-->')) continue;

    const timing = parseCueTiming(timingLine);
    if (!timing) continue;

    const textLines = lines.slice(timingIndex + 1);
    const text = textLines.join('\n').trim();
    if (!text) continue;

    cues.push({ ...timing, text });
  }

  return cues;
}
