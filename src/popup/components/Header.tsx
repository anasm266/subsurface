interface HeaderProps {
  count: number;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export function Header({ count, showHistory, onToggleHistory }: HeaderProps) {
  return (
    <header className="relative border-b border-border px-4 pb-3 pt-4">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent/20 via-accent to-accent-hover/80" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-text-primary">SubSurface</h1>
          <p className="mt-0.5 text-xs text-text-secondary">
            {count === 0
              ? 'watching for subtitles on this page'
              : `${count} subtitle file${count === 1 ? '' : 's'} on this page`}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleHistory}
          className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
            showHistory
              ? 'border-border-active bg-surface-hover text-text-primary'
              : 'border-border text-text-secondary hover:border-border-active hover:text-text-primary'
          }`}
        >
          {showHistory ? 'live' : 'history'}
        </button>
      </div>
    </header>
  );
}
