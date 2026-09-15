interface OrderPhotoPlaceholderProps {
  src?: string | null;
  alt: string;
  label: string;
  className?: string;
  /** `hero` is the item-page photo; default is the menu card tile. */
  variant?: 'card' | 'hero';
}

export function OrderPhotoPlaceholder({
  src,
  alt,
  label,
  className = '',
  variant = 'card',
}: OrderPhotoPlaceholderProps) {
  const sizeClass =
    variant === 'hero'
      ? 'h-[220px] w-full rounded-none text-[13px] md:h-[280px] md:rounded-t-[8px]'
      : 'h-full w-full';
  if (src) {
    return (
      <div className={`sf-photo ${sizeClass} ${className}`.trim()}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`sf-photo ${sizeClass} ${className}`.trim()} aria-hidden>
      {label}
    </div>
  );
}
