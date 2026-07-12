import { roundFinanceMoney } from './money';

export const COGS_DEFAULT_DISCOUNT_STORAGE_KEY = 'mings.cogsDefaultDiscountPercent';

export const COGS_DISCOUNT_PRESETS = [0, 2, 4, 6] as const;

export const DEFAULT_COGS_DISCOUNT_PERCENT = 0;

export function getCogsDefaultDiscountPercent(): number {
  try {
    const stored = localStorage.getItem(COGS_DEFAULT_DISCOUNT_STORAGE_KEY);
    if (stored != null) {
      const n = Number(stored);
      if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_COGS_DISCOUNT_PERCENT;
}

export function setCogsDefaultDiscountPercent(percent: number): void {
  try {
    localStorage.setItem(COGS_DEFAULT_DISCOUNT_STORAGE_KEY, String(percent));
  } catch {
    // ignore
  }
}

export function computePurchaseTotalCost(
  quantity: number,
  unitCost: number,
  discountPercent: number,
): number {
  const listTotal = quantity * unitCost;
  const net = listTotal * (1 - discountPercent / 100);
  return roundFinanceMoney(net);
}

export function computePurchaseDiscountAmount(
  quantity: number,
  unitCost: number,
  discountPercent: number,
): number {
  const listTotal = quantity * unitCost;
  return roundFinanceMoney(listTotal - computePurchaseTotalCost(quantity, unitCost, discountPercent));
}
