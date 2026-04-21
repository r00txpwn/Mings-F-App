interface OrderBrandHeaderProps {
  tagline?: string | null;
  heroImageUrl?: string | null;
  title: string;
}

/**
 * Bold street-food brand strip.
 * - With hero image: short cinematic band with legibility gradient + red accent stripe.
 * - Without hero image: compact typographic banner with diagonal stripe detail.
 */
export function OrderBrandHeader({ tagline, heroImageUrl, title }: OrderBrandHeaderProps) {
  if (heroImageUrl) {
    return (
      <header className="relative overflow-hidden">
        <div className="relative h-36 w-full sm:h-44 lg:h-52">
          <img
            src={heroImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ming-ink via-ming-ink/70 to-ming-ink/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-ming-ink/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-8">
            <p className="ming-eyebrow mb-1.5">Ming&apos;s · Baku</p>
            <h1 className="ming-display text-[26px] leading-[1.05] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {tagline ? (
              <p className="mt-2 max-w-xl text-sm font-medium text-white/85 sm:text-base">
                {tagline}
              </p>
            ) : null}
          </div>
        </div>
        <div className="ming-stripes h-1.5 w-full" aria-hidden />
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden">
      <div className="relative flex items-center gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ming-red text-white shadow-ming sm:h-14 sm:w-14">
          <span className="ming-display text-2xl sm:text-3xl">M</span>
        </div>
        <div className="min-w-0">
          <p className="ming-eyebrow mb-1">Ming&apos;s · Baku</p>
          <h1 className="ming-display text-[22px] leading-[1.05] text-ming-bone sm:text-[26px] lg:text-3xl">
            {title}
          </h1>
          {tagline ? (
            <p className="mt-1 max-w-xl text-[13px] text-ming-ash sm:text-sm">{tagline}</p>
          ) : null}
        </div>
      </div>
      <div className="ming-stripes h-1.5 w-full" aria-hidden />
    </header>
  );
}
