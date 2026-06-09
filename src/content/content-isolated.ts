import { isSubtitleUrl } from '../lib/detector';
import {
  SUBSURFACE_MESSAGE_SOURCE,
  type InjectedCaptureMessage,
  type RuntimeMessage,
} from '../types';

const seenUrls = new Set<string>();
const MAX_BODY_CHARS = 600_000;

function resolvePageTitle(): string {
  return document.title || 'Untitled page';
}

function sendPageTitle(): void {
  const message: RuntimeMessage = {
    type: 'PAGE_TITLE_UPDATE',
    pageTitle: resolvePageTitle(),
  };
  chrome.runtime.sendMessage(message).catch(() => {
    // service worker may be asleep briefly
  });
}

function sendCapture(url: string, rawContent: string, pageTitle: string): void {
  if (!rawContent.trim()) return;

  const dedupeKey = url.split('?')[0];
  if (seenUrls.has(dedupeKey)) return;
  seenUrls.add(dedupeKey);

  const message: RuntimeMessage = {
    type: 'SUBTITLE_CAPTURED',
    url,
    rawContent: rawContent.slice(0, MAX_BODY_CHARS),
    pageTitle,
    frameUrl: window.location.href,
  };

  chrome.runtime.sendMessage(message).catch(() => {
    seenUrls.delete(dedupeKey);
  });
}

async function fetchTrackUrl(url: string): Promise<void> {
  if (!isSubtitleUrl(url)) return;

  try {
    const response = await fetch(url);
    const text = await response.text();
    sendCapture(url, text, resolvePageTitle());
  } catch {
    // cross-origin or blocked fetch
  }
}

function inspectTrackElement(track: HTMLTrackElement): void {
  const src = track.src || track.getAttribute('src');
  if (!src) return;
  void fetchTrackUrl(src);
}

function scanTracks(root: ParentNode): void {
  if (root instanceof HTMLTrackElement) {
    inspectTrackElement(root);
    return;
  }

  root.querySelectorAll?.('track[src]').forEach((node) => {
    inspectTrackElement(node as HTMLTrackElement);
  });
}

window.addEventListener('message', (event: MessageEvent<InjectedCaptureMessage>) => {
  if (event.source !== window) return;
  if (event.data?.source !== SUBSURFACE_MESSAGE_SOURCE) return;

  sendCapture(event.data.url, event.data.rawContent, resolvePageTitle());
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof HTMLTrackElement) {
        inspectTrackElement(node);
        return;
      }

      if (node instanceof HTMLElement) {
        scanTracks(node);
      }
    });
  }
});

function boot(): void {
  sendPageTitle();
  scanTracks(document);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  document.addEventListener('DOMContentLoaded', () => {
    sendPageTitle();
    scanTracks(document);
  });

  const titleObserver = new MutationObserver(() => sendPageTitle());
  const titleElement = document.querySelector('title');
  if (titleElement) {
    titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('visibilitychange', sendPageTitle);
}

if (document.documentElement) {
  boot();
} else {
  document.addEventListener('readystatechange', () => {
    if (document.documentElement) boot();
  });
}

export {};
