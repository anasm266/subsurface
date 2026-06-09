type ButtonState = 'idle' | 'loading' | 'success';

interface ActionButtonProps {
  label: string;
  successLabel: string;
  state: ButtonState;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary';
}

export function ActionButton({
  label,
  successLabel,
  state,
  onClick,
  variant = 'secondary',
}: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  const isSuccess = state === 'success';

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={state === 'loading'}
      className={`relative inline-flex min-w-[92px] items-center justify-center gap-1.5 overflow-hidden rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-70 ${
        isPrimary
          ? 'bg-accent text-base hover:bg-accent-hover'
          : 'border border-border bg-surface text-text-primary hover:border-border-active hover:bg-surface-hover'
      } ${isSuccess ? 'text-success' : ''}`}
    >
      {state === 'loading' ? (
        <span className="inline-flex h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        <span>{isSuccess ? successLabel : label}</span>
      )}
    </button>
  );
}
