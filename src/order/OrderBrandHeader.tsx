interface OrderBrandHeaderProps {
  tagline?: string | null;
  heroImageUrl?: string | null;
  title: string;
}

export function OrderBrandHeader({ tagline, heroImageUrl, title }: OrderBrandHeaderProps) {
  return (
    <div className="relative overflow-hidden border-b border-white/10">
      {heroImageUrl ? (
        <div className="relative h-44 w-full sm:h-52 lg:h-56">
          <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/55 to-zinc-950/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-cockpit-600/10" />
          <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-8">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl">
              {title}
            </h1>
            {tagline ? (
              <p className="mt-2 max-w-xl text-sm font-medium text-zinc-200/95 drop-shadow sm:text-base">
                {tagline}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-4 py-10 sm:px-8">
          <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-cockpit-600/20 blur-3xl" />
          <h1 className="relative text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {tagline ? (
            <p className="relative mt-2 max-w-xl text-sm text-zinc-300 sm:text-base">{tagline}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
