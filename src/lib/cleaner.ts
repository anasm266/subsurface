import type { CueBlock, SubtitleFormat } from '../../types';
import { parseSrt } from './parsers/srt';
import { parseTtml } from './parsers/ttml';
import { parseVtt } from './parsers/vtt';

const SOUND_ANNOTATION =
  /^\s*(\[.*?\]|\(.*?\)|♪.*?♪|♪.*|.*♪)\s*$/i;

const SPEAKER_LABEL =
  /^\s*(>>\s*)?(\[?[A-Z][A-Z0-9_ -]{0,30}\]?:\s*|[A-Z][A-Z0-9_ -]{0,20}:\s*)/;

function stripInlineTags(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .trim();
}

function cleanLine(text: string): string {
  let line = stripInlineTags(text);
  if (SOUND_ANNOTATION.test(line)) return '';
  line = line.replace(SPEAKER_LABEL, '').trim();
  return line.replace(/\s+/g, ' ');
}

function mergeShortCues(cues: CueBlock[]): CueBlock[] {
  const merged: CueBlock[] = [];

  for (const cue of cues) {
    const wordCount = cue.text.split(/\s+/).filter(Boolean).length;
    const previous = merged[merged.length - 1];

    if (previous && wordCount > 0 && wordCount < 4) {
      previous.text = `${previous.text} ${cue.text}`.trim();
      previous.end = cue.end;
      continue;
    }

    merged.push({ ...cue });
  }

  return merged;
}

function dedupeConsecutive(cues: CueBlock[]): CueBlock[] {
  const deduped: CueBlock[] = [];

  for (const cue of cues) {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.text === cue.text) {
      previous.end = cue.end;
      continue;
    }
    deduped.push({ ...cue });
  }

  return deduped;
}

function toParagraphs(cues: CueBlock[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    const previous = cues[index - 1];
    const gap = previous ? cue.start - previous.end : 0;

    if (gap > 2 && current.length > 0) {
      paragraphs.push(current.join(' '));
      current = [];
    }

    current.push(cue.text);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }

  return paragraphs.join('\n\n').trim();
}

export function cleanCues(cues: CueBlock[]): string {
  const cleaned = cues
    .map((cue) => ({ ...cue, text: cleanLine(cue.text) }))
    .filter((cue) => cue.text.length > 0);

  const deduped = dedupeConsecutive(cleaned);
  const merged = mergeShortCues(deduped);
  return toParagraphs(merged);
}

export function parseAndClean(raw: string, format: SubtitleFormat): string {
  let cues: CueBlock[] = [];

  switch (format) {
    case 'vtt':
      cues = parseVtt(raw);
      break;
    case 'srt':
      cues = parseSrt(raw);
      break;
    case 'ttml':
      cues = parseTtml(raw);
      break;
  }

  if (cues.length === 0) {
    return raw
      .replace(/^\uFEFF/, '')
      .replace(/^WEBVTT[^\n]*\n/i, '')
      .replace(/(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}\s*-->\s*(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(SOUND_ANNOTATION, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return cleanCues(cues);
}
