type Props = {
  className?: string;
  /** Compact for sidebars / footers */
  size?: 'sm' | 'md';
  showLabel?: boolean;
};

/** “Powered by” lockup with Strategic Insight logo. */
export function PoweredByStrategicInsight({
  className = '',
  size = 'sm',
  showLabel = true,
}: Props) {
  const h = size === 'md' ? 'h-8' : 'h-6';
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Powered by Strategic Insight"
    >
      {showLabel ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Powered by
        </span>
      ) : null}
      <img
        src="/strategic-insight-logo.png"
        alt="Strategic Insight"
        className={`${h} w-auto max-w-[140px] object-contain object-left`}
      />
    </div>
  );
}
