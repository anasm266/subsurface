import { useState } from 'react';
import { m } from 'motion/react';
import type { CapturedSubtitle } from '../../types';
import { truncateUrl } from '../../lib/platforms';
import { formatRelativeTime, SPRING } from '../utils';
import { ActionButton } from './ActionButton';
import { PreviewDrawer } from './PreviewDrawer';

type ButtonState = 'idle' | 'loading' | 'success';

interface SubtitleCardProps {
  capture: CapturedSubtitle;
  index: number;
  onDownloadRaw: (capture: CapturedSubtitle) => Promise<void>;
  onDownloadClean: (capture: CapturedSubtitle) => Promise<void>;
  onCopy: (capture: CapturedSubtitle) => Promise<void>;
}

export function SubtitleCard({
  capture,
  index,
  onDownloadRaw,
  onDownloadClean,
  onCopy,
}: SubtitleCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadState, setDownloadState] = useState<ButtonState>('idle');
  const [copyState, setCopyState] = useState<ButtonState>('idle');

  async function handleDownload() {
    setDownloadState('loading');
    try {
      await onDownloadClean(capture);
      setDownloadState('success');
      window.setTimeout(() => setDownloadState('idle'), 2000);
    } catch {
      setDownloadState('idle');
    }
  }

  async function handleCopy() {
    setCopyState('loading');
    try {
      await onCopy(capture);
      setCopyState('success');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('idle');
    }
  }

  return (
    <m.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-border bg-surface p-4 shadow-card transition-shadow hover:border-border-active hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">{capture.pageTitle}</p>
          <p className="mt-1 truncate text-xs text-text-muted" title={capture.url}>
            {capture.platform} · {truncateUrl(capture.url)}
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
          {capture.format}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
        <span className="rounded-md bg-base px-2 py-0.5 uppercase">{capture.language}</span>
        <span>{formatRelativeTime(capture.capturedAt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          label="download txt"
          successLabel="saved"
          state={downloadState}
          onClick={handleDownload}
          variant="primary"
        />
        <ActionButton
          label="copy text"
          successLabel="copied"
          state={copyState}
          onClick={handleCopy}
        />
        <button
          type="button"
          onClick={() => setPreviewOpen((open) => !open)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
        >
          {previewOpen ? 'hide' : 'preview'}
        </button>
        <button
          type="button"
          onClick={() => void onDownloadRaw(capture)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
        >
          raw
        </button>
      </div>

      <PreviewDrawer
        open={previewOpen}
        text={capture.cleanText}
        onCopyAll={() => void onCopy(capture)}
      />
    </m.article>
  );
}
