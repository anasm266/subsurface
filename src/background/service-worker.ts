import { parseAndClean } from '../lib/cleaner';
import {
  detectSubtitleUrl,
  hashCaptureId,
  resolveCaptureFormat,
} from '../lib/detector';
import { detectPlatform } from '../lib/platforms';
import { maybeAccumulateSegment } from '../lib/segment-merger';
import {
  addCapture,
  clearCaptures,
  getPageTitle,
  setPageTitle,
} from '../lib/storage';
import type {
  CapturedSubtitle,
  RuntimeMessage,
  SubtitleUpdatedPayload,
} from '../types';

const BADGE_COLOR = '#f59e0b';

chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });

async function updateBadge(tabId: number, count: number): Promise<void> {
  const text = count > 0 ? String(Math.min(count, 99)) : '';
  await chrome.action.setBadgeText({ tabId, text });
}

function broadcastUpdate(message: SubtitleUpdatedPayload): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // popup may not be open
  });
}

async function storeCapture(tabId: number, capture: CapturedSubtitle): Promise<void> {
  const { captures } = await addCapture(tabId, capture);
  await updateBadge(tabId, captures.length);

  broadcastUpdate({
    type: 'SUBTITLE_UPDATED',
    tabId,
    capture: captures.find((item) => item.id === capture.id) ?? capture,
  });
}

async function processCapture(
  tabId: number,
  payload: Extract<RuntimeMessage, { type: 'SUBTITLE_CAPTURED' }>,
): Promise<void> {
  const detection = detectSubtitleUrl(payload.url);
  const format = resolveCaptureFormat(payload.url, payload.rawContent);

  if (!format) return;

  const pageTitle =
    payload.pageTitle ||
    (await getPageTitle(tabId)) ||
    'Untitled page';

  const id = await hashCaptureId(payload.url, format);
  const cleanText = parseAndClean(payload.rawContent, format);
  const platform = detectPlatform(payload.frameUrl || payload.url);

  const capture: CapturedSubtitle = {
    id,
    url: payload.url,
    tabId,
    pageTitle,
    platform,
    language: detection.language,
    format,
    rawContent: payload.rawContent,
    cleanText,
    capturedAt: Date.now(),
  };

  const buffered = maybeAccumulateSegment(capture, async (merged) => {
    await storeCapture(tabId, merged);
  });

  if (buffered) return;

  await storeCapture(tabId, capture);
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'PAGE_TITLE_UPDATE' && tabId !== undefined) {
    void setPageTitle(tabId, message.pageTitle).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === 'SUBTITLE_CAPTURED' && tabId !== undefined) {
    void processCapture(tabId, message).then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;

  void clearCaptures(details.tabId).then(async () => {
    await updateBadge(details.tabId, 0);
    chrome.runtime
      .sendMessage({ type: 'CAPTURES_CLEARED', tabId: details.tabId })
      .catch(() => {
        // popup may not be open
      });
  });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const key = `captures_${tabId}`;
  const result = await chrome.storage.local.get(key);
  const captures = (result[key] as CapturedSubtitle[] | undefined) ?? [];
  await updateBadge(tabId, captures.length);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearCaptures(tabId);
});

export {};
