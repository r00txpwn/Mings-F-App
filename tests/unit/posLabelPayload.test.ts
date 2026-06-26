import { describe, expect, it } from 'vitest';
import {
  buildPrintLabelsFromCreateResponse,
  buildPrintLabelsFromSale,
  sourceToPlatformBadge,
} from '../../src/pos/posLabelPayload';

describe('posLabelPayload', () => {
  it('maps POS sources to platform badges', () => {
    expect(sourceToPlatformBadge('pos_takeaway')).toBe('POS · Takeaway');
    expect(sourceToPlatformBadge('kiosk')).toBe('Kiosk');
    expect(sourceToPlatformBadge('online_delivery')).toBe('Website · Delivery');
  });

  it('builds one label per unit quantity', () => {
    const labels = buildPrintLabelsFromCreateResponse(
      'M042',
      'pos_takeaway',
      [
        {
          id: 'item-1',
          productName: 'Chicken Noodles',
          quantity: 2,
          modifiers: ['Spicy', 'Extra egg'],
          notes: 'less oil',
        },
      ],
      'Call on arrival'
    );
    expect(labels).toHaveLength(2);
    expect(labels[0].displayNumber).toBe('M042');
    expect(labels[0].platformBadge).toBe('POS · Takeaway');
    expect(labels[0].productName).toBe('Chicken Noodles');
    expect(labels[0].modifiers).toEqual(['Spicy', 'Extra egg']);
    expect(labels[0].note).toContain('less oil');
    expect(labels[0].note).toContain('Call on arrival');
  });

  it('builds labels from sale rows for reprint', () => {
    const labels = buildPrintLabelsFromSale(
      {
        display_number: 'M007',
        source: 'pos_eat_in',
        notes: null,
        created_at: '2026-06-20T10:30:00Z',
      },
      [
        {
          id: 'si-1',
          sale_id: 's1',
          product_id: 'p1',
          product_name: 'Soup',
          quantity: 1,
          unit_price: 5,
          total_price: 5,
          sale_item_modifiers: [{ modifier_option_name: 'Mild' } as never],
        },
      ]
    );
    expect(labels).toHaveLength(1);
    expect(labels[0].platformBadge).toBe('POS · Eat In');
    expect(labels[0].modifiers).toEqual(['Mild']);
  });
});
