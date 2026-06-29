/** Light Ming kiosk design tokens — applied via `.kiosk-light` in index.css */
export const KIOSK_THEME = {
  bg: '#f5f0e8',
  card: '#ffffff',
  primary: '#d65745',
  text: '#1a1a1a',
  muted: '#6b6560',
  border: '#e5ddd3',
  teal: '#37bc9d',
} as const;

export const kioskCardClass =
  'rounded-[22px] border border-[var(--kiosk-border)] bg-[var(--kiosk-card)] shadow-sm';

export const kioskPrimaryBtnClass =
  'min-h-[44px] touch-manipulation rounded-xl bg-[var(--kiosk-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50';
