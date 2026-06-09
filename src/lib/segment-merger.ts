import { parseAndClean } from './cleaner';
import { hashCaptureId, isSegmentedSubtitleUrl } from './detector';
import type { CapturedSubtitle } from '../types';

const FLUSH_DELAY_MS = 4000;

interface SegmentGroup {
  captures: CapturedSubtitle[];
  flushTimer: ReturnType<typeof setTimeout> | null;
  onFlush: (merged: CapturedSubtitle) => Promise<void>;
}

const groups = new Map<string, SegmentGroup>();

function getSegmentGroupKey(url: string): string | null {
  if (!isSegmentedSubtitleUrl(url)) return null;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return null;

    pathParts.pop();
    parsed.pathname = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '/';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    const lastSlash = url.lastIndexOf('/');
    if (lastSlash === -1) return null;
    return url.slice(0, lastSlash + 1);
  }
}

function mergeVttSegments(captures: CapturedSubtitle[]): string {
  const sorted = [...captures].sort((a, b) => a.url.localeCompare(b.url));
  const cueBlocks: string[] = [];
  let header = 'WEBVTT';

  for (const capture of sorted) {
    const content = capture.rawContent.replace(/^\uFEFF/, '').trim();
    if (!content) continue;

    if (/^WEBVTT/i.test(content)) {
      const [firstLine, ...rest] = content.split('\n');
      header = firstLine.trim();
      const body = rest.join('\n').trim();
      if (body) cueBlocks.push(body);
      continue;
    }

    cueBlocks.push(content);
  }

  if (cueBlocks.length === 0) {
    return sorted.map((capture) => capture.rawContent).join('\n\n');
  }

  return `${header}\n\n${cueBlocks.join('\n\n')}`.trim();
}

async function flushGroup(key: string): Promise<void> {
  const group = groups.get(key);
  if (!group || group.captures.length === 0) return;

  groups.delete(key);

  const sorted = [...group.captures].sort((a, b) => a.url.localeCompare(b.url));
  const first = sorted[0];
  const mergedRaw = mergeVttSegments(sorted);
  const format = first.format;
  const cleanText = parseAndClean(mergedRaw, format);
  const id = await hashCaptureId(key, format);

  const merged: CapturedSubtitle = {
    id,
    url: key,
    tabId: first.tabId,
    pageTitle: first.pageTitle,
    platform: first.platform,
    language: first.language,
    format,
    rawContent: mergedRaw,
    cleanText,
    capturedAt: first.capturedAt,
  };

  await group.onFlush(merged);
}

export function maybeAccumulateSegment(
  capture: CapturedSubtitle,
  onFlush: (merged: CapturedSubtitle) => Promise<void>,
): boolean {
  const key = getSegmentGroupKey(capture.url);
  if (!key) return false;

  let group = groups.get(key);
  if (!group) {
    group = {
      captures: [],
      flushTimer: null,
      onFlush,
    };
    groups.set(key, group);
  }

  group.onFlush = onFlush;

  const existingIndex = group.captures.findIndex((item) => item.id === capture.id);
  if (existingIndex >= 0) {
    group.captures[existingIndex] = capture;
  } else {
    group.captures.push(capture);
  }

  if (group.flushTimer) {
    clearTimeout(group.flushTimer);
  }

  group.flushTimer = setTimeout(() => {
    void flushGroup(key);
  }, FLUSH_DELAY_MS);

  return true;
}
