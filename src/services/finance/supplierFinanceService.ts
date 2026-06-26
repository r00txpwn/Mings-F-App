import { supabase } from '../../lib/supabase';
import {
  allocatePaymentsFIFO,
  computeSupplierOutstanding,
  type DerivedPurchasePaymentStatus,
} from '../finance/supplierLedger';
import type { AnalyticsServiceResponse } from '../../types/analytics';

export interface SupplierManualDebtRow {
  id: string;
  amount: number;
  debtDate: string;
  notes: string;
  paid: number;
  status: DerivedPurchasePaymentStatus;
}

export interface SupplierAccountPurchase {
  id: string;
  total: number;
  purchaseDate: string;
  paid: number;
  status: DerivedPurchasePaymentStatus;
  notes: string;
}

export interface SupplierAccountPaymentRow {
  id: string;
  amount: number;
  paidDate: string;
  paymentMethod: string;
  notes: string;
}

export interface SupplierAccountSummary {
  supplierId: string;
  supplierName: string;
  manualDebtsTotal: number;
  creditPurchasesTotal: number;
  paymentsTotal: number;
  outstanding: number;
  manualDebts: SupplierManualDebtRow[];
  purchases: SupplierAccountPurchase[];
  payments: SupplierAccountPaymentRow[];
}

export interface LiabilitySummaryItem {
  id: string;
  type: 'loan' | 'other';
  counterparty: string;
  principalAmount: number;
  paidAmount: number;
  outstanding: number;
  status: 'open' | 'partially_paid' | 'settled';
  incurredDate: string;
  dueDate: string | null;
  notes: string;
}

export interface LiabilitiesSummary {
  totalOutstanding: number;
  byType: { loan: number; other: number };
  items: LiabilitySummaryItem[];
}

function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchSupplierAccounts(): Promise<AnalyticsServiceResponse<SupplierAccountSummary[]>> {
  const [suppliersRes, debtsRes, purchasesRes, paymentsRes] = await Promise.all([
    supabase.from('suppliers').select('id, name').order('name'),
    supabase
      .from('supplier_debts')
      .select('id, supplier_id, amount, debt_date, notes')
      .order('debt_date', { ascending: true }),
    supabase
      .from('purchases')
      .select('id, supplier_id, total_cost, purchase_date, notes, is_on_credit')
      .not('supplier_id', 'is', null),
    supabase
      .from('supplier_account_payments')
      .select('id, supplier_id, amount, paid_date, payment_method, notes')
      .order('paid_date', { ascending: false }),
  ]);

  const firstError = suppliersRes.error ?? debtsRes.error ?? purchasesRes.error ?? paymentsRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const suppliers = suppliersRes.data ?? [];
  const debts = debtsRes.data ?? [];
  const purchases = purchasesRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const debtsBySupplier = new Map<string, typeof debts>();
  for (const row of debts) {
    const sid = row.supplier_id as string;
    if (!sid) continue;
    const list = debtsBySupplier.get(sid) ?? [];
    list.push(row);
    debtsBySupplier.set(sid, list);
  }

  const purchasesBySupplier = new Map<string, typeof purchases>();
  for (const row of purchases) {
    const sid = row.supplier_id as string;
    if (!sid) continue;
    const list = purchasesBySupplier.get(sid) ?? [];
    list.push(row);
    purchasesBySupplier.set(sid, list);
  }

  const paymentsBySupplier = new Map<string, typeof payments>();
  for (const row of payments) {
    const sid = row.supplier_id as string;
    if (!sid) continue;
    const list = paymentsBySupplier.get(sid) ?? [];
    list.push(row);
    paymentsBySupplier.set(sid, list);
  }

  const summaries: SupplierAccountSummary[] = suppliers.map((supplier) => {
    const supplierId = supplier.id as string;
    const supplierDebts = debtsBySupplier.get(supplierId) ?? [];
    const supplierPurchases = (purchasesBySupplier.get(supplierId) ?? []).filter((p) => {
      if (p.is_on_credit === false) return false;
      if (p.is_on_credit == null) return true;
      return Boolean(p.is_on_credit);
    });
    const supplierPayments = paymentsBySupplier.get(supplierId) ?? [];

    const debtTotals = supplierDebts.map((d) => safeNumber(d.amount));
    const creditTotals = supplierPurchases.map((p) => safeNumber(p.total_cost));
    const paymentTotals = supplierPayments.map((p) => safeNumber(p.amount));
    const paymentsTotal = paymentTotals.reduce((s, v) => s + v, 0);

    const fifo = allocatePaymentsFIFO(
      supplierDebts.map((d) => ({
        id: d.id as string,
        total: safeNumber(d.amount),
        debtDate: String(d.debt_date).slice(0, 10),
      })),
      supplierPurchases.map((p) => ({
        id: p.id as string,
        total: safeNumber(p.total_cost),
        purchaseDate: String(p.purchase_date).slice(0, 10),
      })),
      paymentsTotal,
    );

    const manualDebtMap = new Map(fifo.manualDebts.map((l) => [l.id, l]));
    const purchaseMap = new Map(fifo.purchases.map((l) => [l.id, l]));

    return {
      supplierId,
      supplierName: String(supplier.name ?? ''),
      manualDebtsTotal: debtTotals.reduce((s, v) => s + v, 0),
      creditPurchasesTotal: creditTotals.reduce((s, v) => s + v, 0),
      paymentsTotal,
      outstanding: computeSupplierOutstanding({
        manualDebts: debtTotals,
        creditPurchases: creditTotals,
        payments: paymentTotals,
      }),
      manualDebts: supplierDebts.map((d) => {
        const alloc = manualDebtMap.get(d.id as string);
        return {
          id: d.id as string,
          amount: safeNumber(d.amount),
          debtDate: String(d.debt_date).slice(0, 10),
          notes: String(d.notes ?? ''),
          paid: alloc?.paid ?? 0,
          status: alloc?.status ?? 'unpaid',
        };
      }),
      purchases: supplierPurchases.map((p) => {
        const alloc = purchaseMap.get(p.id as string);
        return {
          id: p.id as string,
          total: safeNumber(p.total_cost),
          purchaseDate: String(p.purchase_date).slice(0, 10),
          paid: alloc?.paid ?? 0,
          status: alloc?.status ?? 'unpaid',
          notes: String(p.notes ?? ''),
        };
      }),
      payments: supplierPayments.map((p) => ({
        id: p.id as string,
        amount: safeNumber(p.amount),
        paidDate: String(p.paid_date).slice(0, 10),
        paymentMethod: String(p.payment_method ?? ''),
        notes: String(p.notes ?? ''),
      })),
    };
  });

  return { data: summaries, error: null };
}

export async function fetchLiabilitiesSummary(): Promise<AnalyticsServiceResponse<LiabilitiesSummary>> {
  const [liabilitiesRes, paymentsRes] = await Promise.all([
    supabase
      .from('liabilities')
      .select('id, type, counterparty, principal_amount, status, incurred_date, due_date, notes')
      .order('incurred_date', { ascending: false }),
    supabase.from('liability_payments').select('liability_id, amount'),
  ]);

  const firstError = liabilitiesRes.error ?? paymentsRes.error;
  if (firstError) {
    return { data: null, error: firstError.message };
  }

  const paidByLiability = new Map<string, number>();
  for (const row of paymentsRes.data ?? []) {
    const lid = row.liability_id as string;
    paidByLiability.set(lid, (paidByLiability.get(lid) ?? 0) + safeNumber(row.amount));
  }

  const items: LiabilitySummaryItem[] = (liabilitiesRes.data ?? []).map((row) => {
    const principal = safeNumber(row.principal_amount);
    const paid = paidByLiability.get(row.id as string) ?? 0;
    const outstanding = Math.max(0, principal - paid);
    return {
      id: row.id as string,
      type: row.type as 'loan' | 'other',
      counterparty: String(row.counterparty ?? ''),
      principalAmount: principal,
      paidAmount: paid,
      outstanding,
      status: row.status as LiabilitySummaryItem['status'],
      incurredDate: String(row.incurred_date).slice(0, 10),
      dueDate: row.due_date ? String(row.due_date).slice(0, 10) : null,
      notes: String(row.notes ?? ''),
    };
  });

  const byType = { loan: 0, other: 0 };
  let totalOutstanding = 0;
  for (const item of items) {
    totalOutstanding += item.outstanding;
    byType[item.type] += item.outstanding;
  }

  return {
    data: { totalOutstanding, byType, items },
    error: null,
  };
}

export async function fetchTotalOutstandingDebt(): Promise<AnalyticsServiceResponse<number>> {
  const [suppliersRes, liabilitiesRes] = await Promise.all([
    fetchSupplierAccounts(),
    fetchLiabilitiesSummary(),
  ]);

  if (suppliersRes.error) return { data: null, error: suppliersRes.error };
  if (liabilitiesRes.error) return { data: null, error: liabilitiesRes.error };

  const supplierTotal = (suppliersRes.data ?? []).reduce((s, a) => s + a.outstanding, 0);
  const liabilityTotal = liabilitiesRes.data?.totalOutstanding ?? 0;
  return { data: supplierTotal + liabilityTotal, error: null };
}
