export interface VersionTextProps {
  display: string;
  className?: string;
  ariaLabel?: string;
}

export const VersionText = ({ display, className, ariaLabel }: VersionTextProps) => (
  <span className={`${className ?? ""} tabular-nums`} role="img" aria-label={ariaLabel}>
    {display}
  </span>
);
