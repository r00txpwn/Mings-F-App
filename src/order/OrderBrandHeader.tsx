import { orderBrandAssets } from './orderDesign';

interface OrderBrandHeaderProps {
  tagline?: string | null;
  heroImageUrl?: string | null;
  title: string;
}

export function OrderBrandHeader({ tagline, heroImageUrl, title }: OrderBrandHeaderProps) {
  if (heroImageUrl) {
    return (
      <header className="relative overflow-hidden">
        <div className="relative h-28 w-full sm:h-36 lg:h-44">
          <img
            src={heroImageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--order-ink)] via-[rgba(40,20,20,0.7)] to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 lg:bottom-5 lg:left-8">
            <p className="ming-eyebrow mb-1">order.mings.az</p>
            <h1 className="ming-display text-[28px] leading-[0.9] text-white drop-shadow-[0_3px_0_var(--order-ink)] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {tagline ? (
              <p className="mt-2 max-w-xl text-sm font-extrabold text-white sm:text-base">
                {tagline}
              </p>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="order-bg-graphics relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-10 lg:py-6">
      <div className="relative z-[1] flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex w-28 items-center rounded-[18px] bg-white px-3 py-2 shadow-[5px_5px_0_rgba(40,20,20,0.18)] sm:w-36 lg:w-40">
            <img src={orderBrandAssets.wordmark} alt="Ming's" className="w-full object-contain" />
          </div>
          <p className="ming-eyebrow mb-1.5">order.mings.az</p>
          <h1 className="ming-display max-w-2xl text-[34px] leading-[0.86] text-[color:var(--order-ink)] sm:text-[46px] lg:text-[58px]">
            {title}
          </h1>
          {tagline ? (
            <p className="mt-2 max-w-xl text-sm font-extrabold text-[rgba(40,20,20,0.7)] sm:text-base">
              {tagline}
            </p>
          ) : null}
        </div>
        <div className="relative hidden shrink-0 sm:block">
          <div className="order-sticker absolute -left-10 top-4 -rotate-12">fresh</div>
          <img
            src={orderBrandAssets.mascot}
            alt=""
            className="h-24 w-24 object-contain drop-shadow-[5px_6px_0_rgba(40,20,20,0.22)] lg:h-32 lg:w-32"
          />
        </div>
      </div>
    </header>
  );
}
