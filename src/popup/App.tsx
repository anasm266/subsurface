import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import type { BroadcastMessage, CapturedSubtitle } from '../types';
import { getCaptures, getHistory } from '../lib/storage';
import { downloadViaExtension, sanitizeFilename } from './utils';
import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { SubtitleCard } from './components/SubtitleCard';

async function getCurrentTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ?? null;
}

export default function App() {
  const [tabId, setTabId] = useState<number | null>(null);
  const [captures, setCaptures] = useState<CapturedSubtitle[]>([]);
  const [history, setHistory] = useState<CapturedSubtitle[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const visibleCaptures = useMemo(
    () => (showHistory ? history : captures),
    [showHistory, history, captures],
  );

  const refreshCaptures = useCallback(async (activeTabId: number) => {
    const [tabCaptures, captureHistory] = await Promise.all([
      getCaptures(activeTabId),
      getHistory(),
    ]);
    setCaptures(tabCaptures);
    setHistory(captureHistory);
  }, []);

  useEffect(() => {
    void getCurrentTabId().then((activeTabId) => {
      if (activeTabId === null) return;
      setTabId(activeTabId);
      void refreshCaptures(activeTabId);
    });
  }, [refreshCaptures]);

  useEffect(() => {
    const onMessage = (message: BroadcastMessage) => {
      if (tabId === null) return;

      if (message.type === 'CAPTURES_CLEARED' && message.tabId === tabId) {
        setCaptures([]);
        return;
      }

      if (message.type === 'SUBTITLE_UPDATED' && message.tabId === tabId) {
        void refreshCaptures(tabId);
      }
    };

    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [tabId, refreshCaptures]);

  useEffect(() => {
    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local' || tabId === null) return;

      const captureKey = `captures_${tabId}`;
      if (changes[captureKey] || changes.capture_history) {
        void refreshCaptures(tabId);
      }
    };

    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [tabId, refreshCaptures]);

  async function handleDownloadRaw(capture: CapturedSubtitle) {
    const filename = `${sanitizeFilename(capture.pageTitle)}.${capture.format}`;
    await downloadViaExtension(filename, capture.rawContent, 'text/plain');
  }

  async function handleDownloadClean(capture: CapturedSubtitle) {
    const filename = `${sanitizeFilename(capture.pageTitle)}.txt`;
    await downloadViaExtension(filename, capture.cleanText, 'text/plain');
  }

  async function handleCopy(capture: CapturedSubtitle) {
    await navigator.clipboard.writeText(capture.cleanText);
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex h-[520px] w-[380px] flex-col overflow-hidden bg-base text-text-primary"
      >
        <Header
          count={showHistory ? history.length : captures.length}
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory((value) => !value)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4">
          {visibleCaptures.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {visibleCaptures.map((capture, index) => (
                  <SubtitleCard
                    key={capture.id}
                    capture={capture}
                    index={index}
                    onDownloadRaw={handleDownloadRaw}
                    onDownloadClean={handleDownloadClean}
                    onCopy={handleCopy}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>

        <footer className="border-t border-border px-4 py-2 text-[10px] text-text-muted">
          nothing leaves your browser · subtitles stay local
        </footer>
      </m.div>
    </LazyMotion>
  );
}
