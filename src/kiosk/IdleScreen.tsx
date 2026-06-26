import { useLanguage } from '../contexts/LanguageContext';
import { MingsWordmark } from '../components/MingsWordmark';

interface IdleScreenProps {
  onStart: () => void;
  heroImageUrl?: string | null;
}

export function IdleScreen({ onStart, heroImageUrl }: IdleScreenProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col select-none"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <span
          className="mb-4 text-5xl font-bold tracking-tight"
          style={{ color: 'var(--kiosk-primary)' }}
        >
          ming&apos;s
        </span>
        <h1 className="mb-2 text-3xl font-bold leading-tight" style={{ color: 'var(--kiosk-text)' }}>
          {t.tapToOrder}
        </h1>
        <p className="text-base font-medium" style={{ color: 'var(--kiosk-muted)' }}>
          {t.kioskWelcomeTitle}
        </p>
      </div>

      <div className="px-8 pb-6">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-5">
          <button
            type="button"
            onClick={onStart}
            className="group flex min-h-[200px] touch-manipulation flex-col items-center justify-center gap-4 rounded-[22px] border-2 p-8 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--kiosk-card)',
              borderColor: 'var(--kiosk-border)',
            }}
          >
            <span className="text-5xl">🪑</span>
            <span className="text-xl font-bold group-hover:text-[var(--kiosk-primary)]" style={{ color: 'var(--kiosk-text)' }}>
              {t.kioskEatIn}
            </span>
          </button>

          <button
            type="button"
            onClick={onStart}
            className="group flex min-h-[200px] touch-manipulation flex-col items-center justify-center gap-4 rounded-[22px] border-2 p-8 transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--kiosk-card)',
              borderColor: 'var(--kiosk-border)',
            }}
          >
            <span className="text-5xl">🥡</span>
            <span className="text-xl font-bold group-hover:text-[var(--kiosk-primary)]" style={{ color: 'var(--kiosk-text)' }}>
              {t.kioskTakeOut}
            </span>
          </button>
        </div>
      </div>

      <div
        className="relative mx-4 mb-4 h-40 overflow-hidden rounded-[22px] sm:h-48"
        style={{
          background: heroImageUrl
            ? undefined
            : `linear-gradient(135deg, rgba(214,87,69,0.15), rgba(245,240,232,1))`,
        }}
      >
        {heroImageUrl ? (
          <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <MingsWordmark className="h-20 w-auto max-w-[70%] object-contain sm:h-24" />
          </div>
        )}
      </div>
    </div>
  );
}
