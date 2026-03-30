type Props = {
  className?: string;
};

/** Ming's wordmark asset (yellow on black). Prefer on dark surfaces or inside a black container on light UI. */
export function MingsWordmark({ className }: Props) {
  return (
    <img
      src="/mings-logo.png"
      alt="Ming's Logo"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
