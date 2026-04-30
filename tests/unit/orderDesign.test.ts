import { describe, expect, it } from 'vitest';
import { getOrderCardShapeClass, orderCampaignColors } from '../../src/order/orderDesign';

describe('order campaign design tokens', () => {
  it('exposes the approved campaign palette', () => {
    expect(orderCampaignColors.posterMint).toBe('#B4E6DC');
    expect(orderCampaignColors.promoCoral).toBe('#F04646');
    expect(orderCampaignColors.espressoInk).toBe('#281414');
  });

  it('cycles controlled funky card shapes', () => {
    expect(getOrderCardShapeClass(0)).toContain('rounded-[34px_16px_34px_16px]');
    expect(getOrderCardShapeClass(1)).toContain('rounded-[16px_34px_16px_34px]');
    expect(getOrderCardShapeClass(2)).toContain('rounded-[28px_18px_32px_18px]');
    expect(getOrderCardShapeClass(3)).toContain('rounded-[34px_16px_34px_16px]');
  });
});
