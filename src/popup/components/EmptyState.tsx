export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
        <span className="absolute h-10 w-10 rounded-full border border-accent/30 animate-sonar" />
        <span
          className="absolute h-10 w-10 rounded-full border border-accent/20 animate-sonar"
          style={{ animationDelay: '0.8s' }}
        />
        <span
          className="absolute h-10 w-10 rounded-full border border-accent/10 animate-sonar"
          style={{ animationDelay: '1.6s' }}
        />
        <span className="relative h-3 w-3 rounded-full bg-accent shadow-[0_0_16px_rgba(245,158,11,0.8)]" />
      </div>
      <p className="text-sm font-medium text-text-primary">watching for subtitles...</p>
      <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-text-secondary">
        play any video on this page and subtitle files will show up here automatically
      </p>
    </div>
  );
}
