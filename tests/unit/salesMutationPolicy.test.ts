import { describe, expect, it } from 'vitest';
import { assertSalesMutationAllowed } from '../../src/lib/salesMutationPolicy';

describe('assertSalesMutationAllowed — staff kitchen workflow', () => {
  const kitchenSale = {
    id: 'sale-1',
    source: 'online_delivery',
    online_payment_method: 'cash_delivery',
    payment_method: null,
  };

  it('allows status workflow updates', () => {
    const result = assertSalesMutationAllowed('staff', 'update', kitchenSale, {
      order_status: 'preparing',
      prep_started_at: '2026-07-12T10:00:00.000Z',
      estimated_ready_at: '2026-07-12T10:15:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sanitizedPayload).toEqual({
        order_status: 'preparing',
        prep_started_at: '2026-07-12T10:00:00.000Z',
        estimated_ready_at: '2026-07-12T10:15:00.000Z',
      });
    }
  });

  it('allows cash mark-paid patch on COD orders', () => {
    const result = assertSalesMutationAllowed('staff', 'update', kitchenSale, {
      payment_status: 'paid',
      paid_at: '2026-07-12T10:20:00.000Z',
      payment_method: 'cash',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects financial field edits', () => {
    const result = assertSalesMutationAllowed('staff', 'update', kitchenSale, {
      total_price: 0.01,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects insert and delete', () => {
    expect(assertSalesMutationAllowed('staff', 'insert', null, {}).ok).toBe(false);
    expect(assertSalesMutationAllowed('staff', 'delete', kitchenSale).ok).toBe(false);
  });

  it('rejects relabeling card orders as cash', () => {
    const cardSale = {
      ...kitchenSale,
      online_payment_method: 'card_online',
      payment_method: 'card',
    };
    const result = assertSalesMutationAllowed('staff', 'update', cardSale, {
      payment_status: 'paid',
      paid_at: '2026-07-12T10:20:00.000Z',
      payment_method: 'cash',
    });
    expect(result.ok).toBe(false);
  });
});

describe('assertSalesMutationAllowed — manual partner sales', () => {
  const manualSale = { id: 'manual-1', source: 'manual' };

  it('allows manager manual CRUD fields', () => {
    const insert = assertSalesMutationAllowed('manager', 'insert', null, {
      total_price: 50,
      quantity: 2,
      unit_price: 25,
      sales_channel_id: 'channel-1',
      notes: 'Wolt batch',
      sale_date: '2026-07-12',
    });
    expect(insert.ok).toBe(true);
    if (insert.ok) {
      expect(insert.sanitizedPayload?.source).toBe('manual');
    }

    const update = assertSalesMutationAllowed('manager', 'update', manualSale, {
      total_price: 60,
      quantity: 2,
      unit_price: 30,
      sales_channel_id: 'channel-1',
      notes: 'Adjusted',
      sale_date: '2026-07-12',
    });
    expect(update.ok).toBe(true);

    expect(assertSalesMutationAllowed('manager', 'delete', manualSale).ok).toBe(true);
  });

  it('rejects crafted financial fields on kitchen orders for managers', () => {
    const result = assertSalesMutationAllowed('manager', 'update', {
      id: 'k-1',
      source: 'kiosk',
    }, {
      total_price: 1,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects manual delete on kitchen orders', () => {
    const result = assertSalesMutationAllowed('admin', 'delete', {
      id: 'k-2',
      source: 'online_takeaway',
    });
    expect(result.ok).toBe(false);
  });
});
