export const orderCampaignColors = {
  posterMint: '#B4E6DC',
  promoCoral: '#F04646',
  espressoInk: '#281414',
  posterWhite: '#FFFFFF',
  kraftBox: '#B48C64',
  warmKraft: '#E6D2B4',
  hotOrange: '#FA963C',
} as const;

export const orderBrandAssets = {
  wordmark: '/brand/mings-wordmark-black.png',
  mascot: '/brand/mings-mascot.png',
} as const;

const ORDER_CARD_SHAPES = [
  'rounded-[34px_16px_34px_16px]',
  'rounded-[16px_34px_16px_34px]',
  'rounded-[28px_18px_32px_18px]',
] as const;

export function getOrderCardShapeClass(index: number): string {
  const safeIndex = Math.abs(Math.trunc(index));
  return ORDER_CARD_SHAPES[safeIndex % ORDER_CARD_SHAPES.length];
}

export function getOrderCardShadowClass(index: number): string {
  return index % 2 === 0 ? 'shadow-[9px_9px_0_var(--order-ink)]' : 'shadow-[9px_9px_0_var(--order-coral)]';
}
