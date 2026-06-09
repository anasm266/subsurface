import type { CueBlock } from '../../types';

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function stripTags(text: string): string {
  return decodeXmlEntities(text.replace(/<[^>]+>/g, '')).trim();
}

function parseParagraphCue(
  attrs: string,
  text: string,
): CueBlock | null {
  const cleanedText = stripTags(text);
  if (!cleanedText) return null;

  const startMatch = attrs.match(/\bt=["']?(\d+)["']?/i);
  if (!startMatch) return null;

  const durationMatch = attrs.match(/\bd=["']?(\d+)["']?/i);
  const start = Number(startMatch[1]) / 1000;
  const duration = durationMatch ? Number(durationMatch[1]) / 1000 : 0;
  const end = duration > 0 ? start + duration : start + 0.001;

  return { start, end, text: cleanedText };
}

export function parseYoutubeSrv3(raw: string): CueBlock[] {
  const cues: CueBlock[] = [];
  const paragraphPattern = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;

  let match = paragraphPattern.exec(raw);
  while (match) {
    const cue = parseParagraphCue(match[1], match[2]);
    if (cue) cues.push(cue);
    match = paragraphPattern.exec(raw);
  }

  if (cues.length > 0) return cues;

  const textPattern = /<text\b([^>]*)(?:\/>|>([\s\S]*?)<\/text>)/gi;
  match = textPattern.exec(raw);
  while (match) {
    const attrs = match[1];
    const content = match[2] ?? '';
    const cleanedText = stripTags(content);
    if (!cleanedText) {
      match = textPattern.exec(raw);
      continue;
    }

    const startMatch = attrs.match(/\bstart=["']?([\d.]+)["']?/i);
    if (!startMatch) {
      match = textPattern.exec(raw);
      continue;
    }

    const durationMatch = attrs.match(/\bdur=["']?([\d.]+)["']?/i);
    const start = Number(startMatch[1]);
    const duration = durationMatch ? Number(durationMatch[1]) : 0;
    const end = duration > 0 ? start + duration : start + 0.001;

    cues.push({ start, end, text: cleanedText });
    match = textPattern.exec(raw);
  }

  return cues;
}

export function isYoutubeSrv3Content(raw: string): boolean {
  const trimmed = raw.replace(/^\uFEFF/, '').trim();
  if (/<timedtext\b/i.test(trimmed) && /<p\b[^>]*\bt=["']?\d+/i.test(trimmed)) {
    return true;
  }

  return /<transcript\b/i.test(trimmed) && /<text\b[^>]*\bstart=/i.test(trimmed);
}
