import { useLanguage } from '../contexts/LanguageContext';

interface IdleScreenProps {
  onStart: () => void;
}

export function IdleScreen({ onStart }: IdleScreenProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-col min-h-full select-none font-montserrat"
      style={{ backgroundColor: 'var(--kiosk-bg)' }}
    >
      {/* Top section — logo / heading */}
      <div className="flex flex-col items-center justify-center flex-1 px-8 pt-12 pb-6 text-center">
        <div className="mb-6">
          <span
            className="text-5xl font-bold tracking-tight"
            style={{ color: 'var(--kiosk-primary)' }}
          >
            ming's
          </span>
        </div>
        <h1
          className="text-3xl font-bold leading-tight mb-2"
          style={{ color: 'var(--kiosk-white)' }}
        >
          {t.tapToOrder}
        </h1>
        <p
          className="text-lg font-medium"
          style={{ color: 'var(--kiosk-smoke)' }}
        >
          {t.menu}
        </p>
      </div>

      {/* Bottom section — curved background with Eat In / Take Out blocks */}
      <div
        className="px-8 pb-12 pt-8"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 120%, rgba(214,87,69,0.12), transparent 65%), var(--kiosk-bg)`,
        }}
      >
        <p
          className="text-center text-sm font-semibold uppercase tracking-widest mb-6"
          style={{ color: 'var(--kiosk-smoke)' }}
        >
          Where will you be eating today?
        </p>

        <div className="grid grid-cols-2 gap-5 max-w-xl mx-auto">
          {/* Eat In */}
          <button
            onClick={onStart}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[22px] transition-all active:scale-95 min-h-[200px] border-2"
            style={{
              backgroundColor: 'var(--kiosk-card)',
              borderColor: 'var(--kiosk-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--kiosk-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--kiosk-border)';
            }}
          >
            <span className="text-5xl">🪑</span>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--kiosk-white)' }}
            >
              Eat In
            </span>
          </button>

          {/* Take Out */}
          <button
            onClick={onStart}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-[22px] transition-all active:scale-95 min-h-[200px] border-2"
            style={{
              backgroundColor: 'var(--kiosk-card)',
              borderColor: 'var(--kiosk-border)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--kiosk-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--kiosk-border)';
            }}
          >
            <span className="text-5xl">🥡</span>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--kiosk-white)' }}
            >
              Take Out
            </span>
          </button>
        </div>

        {/* Coral accent bar */}
        <div
          className="mt-10 mx-auto w-12 h-1 rounded-full"
          style={{ backgroundColor: 'var(--kiosk-primary)', opacity: 0.6 }}
        />
      </div>
    </div>
  );
}
