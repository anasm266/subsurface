import { AnimatePresence, m } from 'motion/react';
import { SPRING } from '../utils';

interface PreviewDrawerProps {
  open: boolean;
  text: string;
  onCopyAll: () => void;
}

export function PreviewDrawer({ open, text, onCopyAll }: PreviewDrawerProps) {
  const previewLines = text.split('\n').filter(Boolean).slice(0, 5);
  const hasMore = text.split('\n').filter(Boolean).length > 5;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <m.div
          key="preview"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRING}
          className="overflow-hidden"
        >
          <div className="relative mt-3 rounded-lg border border-border bg-base/60 p-3">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
              {previewLines.join('\n\n')}
            </p>
            {hasMore ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-10 h-10 bg-gradient-to-t from-base/95 to-transparent" />
            ) : null}
            <button
              type="button"
              onClick={onCopyAll}
              className="mt-3 text-xs font-medium text-accent hover:text-accent-hover"
            >
              copy all
            </button>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
