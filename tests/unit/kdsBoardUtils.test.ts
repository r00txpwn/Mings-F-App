import { describe, expect, it } from 'vitest';
import {
  allItemsPrepared,
  applyKdsFilters,
  filterOrdersBySearch,
  flattenLineItems,
  groupOrdersByStatus,
  normalizeSearchQuery,
} from '../../src/kds/kdsBoardUtils';
import type { KdsKitchenOrder } from '../../src/kds/kdsBoardUtils';
import type { SaleItem } from '../../src/lib/supabase';

function order(partial: Partial<KdsKitchenOrder> & { id: string }): KdsKitchenOrder {
  return {
    id: partial.id,
    product_id: null,
    sales_channel_id: null,
    quantity: 1,
    unit_price: 10,
    total_price: 10,
    sale_date: '2026-06-18',
    notes: '',
    created_by: null,
    created_at: '2026-06-18T10:00:00Z',
    order_status: partial.order_status ?? 'pending',
    display_number: partial.display_number ?? 'M001',
    source: partial.source ?? 'online_takeaway',
    sale_items: partial.sale_items ?? [],
    ...partial,
  };
}

describe('groupOrdersByStatus', () => {
  it('splits orders into pending, preparing, ready', () => {
    const orders = [
      order({ id: '1', order_status: 'pending' }),
      order({ id: '2', order_status: 'preparing' }),
      order({ id: '3', order_status: 'ready' }),
      order({ id: '4', order_status: 'pending' }),
    ];
    const groups = groupOrdersByStatus(orders);
    expect(groups.pending.map((o) => o.id)).toEqual(['1', '4']);
    expect(groups.preparing.map((o) => o.id)).toEqual(['2']);
    expect(groups.ready.map((o) => o.id)).toEqual(['3']);
  });

  it('returns empty groups for empty input', () => {
    const groups = groupOrdersByStatus([]);
    expect(groups.pending).toEqual([]);
    expect(groups.preparing).toEqual([]);
    expect(groups.ready).toEqual([]);
  });
});

describe('filterOrdersBySearch', () => {
  it('matches display_number with or without hash prefix', () => {
    const orders = [
      order({ id: '1', display_number: 'M042' }),
      order({ id: '2', display_number: 'M043' }),
    ];
    expect(filterOrdersBySearch(orders, '#M042').map((o) => o.id)).toEqual(['1']);
    expect(filterOrdersBySearch(orders, 'm042').map((o) => o.id)).toEqual(['1']);
  });

  it('normalizeSearchQuery strips hash', () => {
    expect(normalizeSearchQuery('  #M042 ')).toBe('m042');
  });
});

describe('applyKdsFilters', () => {
  it('filters by source and search together', () => {
    const orders = [
      order({ id: '1', source: 'online_delivery', display_number: 'M010' }),
      order({ id: '2', source: 'kiosk', display_number: 'M011' }),
      order({ id: '3', source: 'online_delivery', display_number: 'M012' }),
    ];
    const result = applyKdsFilters(orders, 'online_delivery', 'M010');
    expect(result.map((o) => o.id)).toEqual(['1']);
  });
});

describe('flattenLineItems', () => {
  it('returns single line for regular item', () => {
    const item = {
      id: 'item-1',
      sale_id: 's1',
      product_id: null,
      product_name: 'Dumplings',
      quantity: 2,
      unit_price: 5,
      total_price: 10,
      notes: null,
      created_at: '2026-06-18T10:00:00Z',
    } as SaleItem;
    const lines = flattenLineItems(item);
    expect(lines).toHaveLength(1);
    expect(lines[0].label).toBe('Dumplings');
    expect(lines[0].quantity).toBe(2);
  });

  it('flattens combo sub-lines', () => {
    const item = {
      id: 'combo-1',
      sale_id: 's1',
      product_id: null,
      product_name: 'Combo',
      quantity: 1,
      unit_price: 15,
      total_price: 15,
      notes: null,
      created_at: '2026-06-18T10:00:00Z',
      is_combo: true,
      combo_selections: {
        combo: 'Lunch Deal',
        items: [
          { group: 'Main', item: 'Noodles', modifiers: ['Extra spicy'] },
          { group: 'Drink', item: 'Tea' },
        ],
      },
    } as SaleItem;
    const lines = flattenLineItems(item);
    expect(lines).toHaveLength(2);
    expect(lines[0].label).toBe('Noodles');
    expect(lines[0].groupLabel).toBe('Main');
    expect(lines[1].label).toBe('Tea');
  });
});

describe('allItemsPrepared', () => {
  it('returns true when every line has preparedAt', () => {
    expect(
      allItemsPrepared([
        { id: '1', saleItemId: 'a', label: 'A', quantity: 1, preparedAt: '2026-06-18T10:00:00Z' },
        { id: '2', saleItemId: 'b', label: 'B', quantity: 1, preparedAt: '2026-06-18T10:01:00Z' },
      ])
    ).toBe(true);
  });

  it('returns false when any line is missing preparedAt', () => {
    expect(
      allItemsPrepared([
        { id: '1', saleItemId: 'a', label: 'A', quantity: 1, preparedAt: '2026-06-18T10:00:00Z' },
        { id: '2', saleItemId: 'b', label: 'B', quantity: 1, preparedAt: null },
      ])
    ).toBe(false);
  });

  it('returns true for empty list', () => {
    expect(allItemsPrepared([])).toBe(true);
  });
});
