import type { CapturedSubtitle } from '../types';

const MAX_CAPTURES = 20;
const MAX_RAW_BYTES = 500 * 1024;

function capturesKey(tabId: number): string {
  return `captures_${tabId}`;
}

function pageTitleKey(tabId: number): string {
  return `pagetitle_${tabId}`;
}

function historyKey(): string {
  return 'capture_history';
}

function trimRawContent(rawContent: string): string {
  const bytes = new TextEncoder().encode(rawContent);
  if (bytes.length <= MAX_RAW_BYTES) {
    return rawContent;
  }

  const slice = bytes.slice(0, MAX_RAW_BYTES);
  return new TextDecoder().decode(slice);
}

async function readStorage<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T | undefined) ?? fallback;
}

export async function getCaptures(tabId: number): Promise<CapturedSubtitle[]> {
  return readStorage<CapturedSubtitle[]>(capturesKey(tabId), []);
}

export async function getPageTitle(tabId: number): Promise<string> {
  return readStorage<string>(pageTitleKey(tabId), '');
}

export async function setPageTitle(tabId: number, pageTitle: string): Promise<void> {
  await chrome.storage.local.set({ [pageTitleKey(tabId)]: pageTitle });
}

export async function getHistory(): Promise<CapturedSubtitle[]> {
  return readStorage<CapturedSubtitle[]>('capture_history', []);
}

export async function addCapture(
  tabId: number,
  capture: CapturedSubtitle,
): Promise<{ added: boolean; captures: CapturedSubtitle[] }> {
  const existing = await getCaptures(tabId);
  const index = existing.findIndex((item) => item.id === capture.id);

  const nextCapture: CapturedSubtitle = {
    ...capture,
    tabId,
    rawContent: trimRawContent(capture.rawContent),
  };

  let nextList: CapturedSubtitle[];

  if (index >= 0) {
    nextList = [...existing];
    nextList[index] = {
      ...nextList[index],
      ...nextCapture,
      capturedAt: Date.now(),
    };
    await chrome.storage.local.set({ [capturesKey(tabId)]: nextList });
    await upsertHistory(nextList[index]);
    return { added: false, captures: nextList };
  }

  nextList = [nextCapture, ...existing].slice(0, MAX_CAPTURES);
  await chrome.storage.local.set({ [capturesKey(tabId)]: nextList });
  await upsertHistory(nextCapture);
  return { added: true, captures: nextList };
}

async function upsertHistory(capture: CapturedSubtitle): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((item) => item.id !== capture.id);
  const nextHistory = [capture, ...filtered].slice(0, 50);
  await chrome.storage.local.set({ [historyKey()]: nextHistory });
}

export async function clearCaptures(tabId: number): Promise<void> {
  await chrome.storage.local.remove(capturesKey(tabId));
}

export async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}
