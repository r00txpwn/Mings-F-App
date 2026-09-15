import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Language } from '../translations';
import type { Product, ModifierGroup, ModifierOption, SelectedModifiers } from '../lib/supabase';
import {
  effectiveModifierGroupMaxSelect,
  isSingleSelectModifierGroup,
} from '../lib/modifierGroupConstraints';
import { OrderLangChips } from './OrderLangChips';
import { OrderPhotoPlaceholder } from './OrderPhotoPlaceholder';
import { formatStorefrontAzn, formatStorefrontAznDelta } from './storefrontMoney';

export interface OrderItemCustomizeLabels {
  backToMenu: string;
  languageLabel: string;
  cartAriaLabel: string;
  photoPlaceholder: string;
  required: string;
  optional: string;
  chooseOne: string;
  chooseUpTo: string;
  included: string;
  addToCart: string;
  selectRequired: string;
  decreaseQty: string;
  increaseQty: string;
  quantity: string;
  halal: string;
}

interface OrderItemCustomizeViewProps {
  product: Product;
  onAddToCart: (product: Product, selectedModifiers: SelectedModifiers) => void;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  cartCount: number;
  onOpenCart: () => void;
  labels: OrderItemCustomizeLabels;
}

function optionPriceLabel(
  price: number,
  group: ModifierGroup,
  labels: OrderItemCustomizeLabels,
): string {
  if (price !== 0) return formatStorefrontAznDelta(price);
  const siblingsPaid = (group.modifier_options ?? []).some((o) => Number(o.price_adjustment) !== 0);
  return siblingsPaid ? labels.included : '—';
}

export function OrderItemCustomizeView({
  product,
  onAddToCart,
  onClose,
  language,
  onLanguageChange,
  cartCount,
  onOpenCart,
  labels,
}: OrderItemCustomizeViewProps) {
  const [selections, setSelections] = useState<SelectedModifiers>({});
  const [quantity, setQuantity] = useState(1);

  const groups = useMemo(() => {
    return (product.modifier_groups || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((g) => ({
        ...g,
        modifier_options: (g.modifier_options || [])
          .filter((o) => o.is_available)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      }));
  }, [product.modifier_groups]);

  useEffect(() => {
    const defaults: SelectedModifiers = {};
    groups.forEach((group) => {
      const maxSel = effectiveModifierGroupMaxSelect(group);
      const minSel = Math.max(0, Number(group.min_select ?? 0));
      const isSingleSelect = isSingleSelectModifierGroup(group);
      const defaultOptions = group.modifier_options.filter((o) => o.is_default);
      if (defaultOptions.length === 0) return;
      if (isSingleSelect) {
        defaults[group.id] = [defaultOptions[0]];
        return;
      }
      if (group.is_required && minSel > 0) {
        const count = Math.min(maxSel, minSel, defaultOptions.length);
        if (count > 0) defaults[group.id] = defaultOptions.slice(0, count);
      }
    });
    setSelections(defaults);
  }, [groups]);

  const handleToggleOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      const maxSel = effectiveModifierGroupMaxSelect(group);
      const isSingleSelect = isSingleSelectModifierGroup(group);
      if (isSingleSelect) return { ...prev, [group.id]: [option] };
      const isSelected = current.some((o) => o.id === option.id);
      if (isSelected) return { ...prev, [group.id]: current.filter((o) => o.id !== option.id) };
      if (current.length >= maxSel) return prev;
      return { ...prev, [group.id]: [...current, option] };
    });
  };

  const getOptionQuantity = (groupId: string, optionId: string) =>
    (selections[groupId] || []).filter((o) => o.id === optionId).length;

  const changeOptionQuantity = (group: ModifierGroup, option: ModifierOption, delta: 1 | -1) => {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      const maxSel = effectiveModifierGroupMaxSelect(group);
      if (isSingleSelectModifierGroup(group)) return prev;
      if (delta > 0) {
        if (current.length >= maxSel) return prev;
        return { ...prev, [group.id]: [...current, option] };
      }
      const removeAt = current.findIndex((o) => o.id === option.id);
      if (removeAt < 0) return prev;
      const next = [...current];
      next.splice(removeAt, 1);
      return { ...prev, [group.id]: next };
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) =>
    (selections[groupId] || []).some((o) => o.id === optionId);

  const allRequiredMet = groups.every((group) => {
    if (!group.is_required) return true;
    const selected = selections[group.id] || [];
    return selected.length >= group.min_select;
  });

  const modifierTotal = Object.values(selections)
    .flat()
    .reduce((sum, opt) => sum + Number(opt.price_adjustment), 0);
  const totalPrice = (Number(product.selling_price) + modifierTotal) * quantity;

  const handleAdd = () => {
    for (let i = 0; i < quantity; i += 1) {
      onAddToCart(product, { ...selections });
    }
    onClose();
  };

  return (
    <div className="sf-shell fixed inset-0 z-50 flex flex-col bg-sf-bg" role="dialog" aria-modal="true" aria-label={product.name}>
      <header className="sticky top-0 z-40 border-b border-sf-line bg-sf-surface">
        <div className="mx-auto flex min-h-14 w-full max-w-[520px] items-center gap-3 px-4 py-2">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-sf-ink">
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            {labels.backToMenu}
          </button>
          <span className="flex-1" />
          <OrderLangChips language={language} onChange={onLanguageChange} label={labels.languageLabel} />
          <button type="button" onClick={onOpenCart} className="sf-icon-btn" aria-label={labels.cartAriaLabel}>
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {cartCount > 0 ? <span className="sf-cart-count">{cartCount > 99 ? '99+' : cartCount}</span> : null}
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[520px] flex-1 overflow-y-auto pb-[calc(var(--sf-cartbar-h)+20px)]">
        <article className="border-b border-sf-line bg-sf-surface md:mt-5 md:overflow-hidden md:rounded-lg md:border">
          <OrderPhotoPlaceholder
            src={product.image_url}
            alt={product.name}
            label={labels.photoPlaceholder}
            variant="hero"
          />
          <div className="px-4 pb-2 pt-4">
            <h1 className="m-0 text-[22px] font-semibold tracking-[-0.02em] text-sf-ink">
              {product.name}
              {product.is_halal ? <span className="sf-badge">{labels.halal}</span> : null}
            </h1>
            {product.description ? (
              <p className="mb-2.5 mt-1.5 text-sm text-sf-muted">{product.description}</p>
            ) : null}
            <p className="text-base font-semibold tabular-nums text-sf-ink">
              {formatStorefrontAzn(product.selling_price)}
            </p>
          </div>

          <div className="px-4 pb-5">
            {groups.map((group) => {
              const selectedCount = (selections[group.id] || []).length;
              const maxSel = effectiveModifierGroupMaxSelect(group);
              const isSingle = isSingleSelectModifierGroup(group);
              const reqLabel = group.is_required
                ? isSingle
                  ? `${labels.required} · ${labels.chooseOne}`
                  : `${labels.required} · ${labels.chooseUpTo} ${maxSel}`
                : labels.optional;
              return (
                <div key={group.id} className="mt-[18px]">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h2 className="m-0 text-sm font-semibold text-sf-ink">{group.name}</h2>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${
                        group.is_required ? 'text-sf-accent' : 'text-sf-muted'
                      }`}
                    >
                      {reqLabel}
                    </span>
                  </div>
                  {group.modifier_options.map((option) => {
                    const selected = isOptionSelected(group.id, option.id);
                    const optionQty = getOptionQuantity(group.id, option.id);
                    const price = Number(option.price_adjustment);
                    if (!isSingle) {
                      const canIncrease = selectedCount < maxSel;
                      const canDecrease = optionQty > 0;
                      return (
                        <div
                          key={option.id}
                          className="sf-choice"
                          data-checked={optionQty > 0 ? 'true' : 'false'}
                        >
                          <span className="sf-choice-mark sf-choice-mark--check" aria-hidden />
                          <span className="flex-1 text-sm font-medium text-sf-ink">{option.name}</span>
                          <span className="text-[13px] tabular-nums text-sf-muted">
                            {optionPriceLabel(price, group, labels)}
                          </span>
                          <div className="sf-qty">
                            <button
                              type="button"
                              disabled={!canDecrease}
                              aria-label={labels.decreaseQty}
                              onClick={() => changeOptionQuantity(group, option, -1)}
                            >
                              <Minus className="mx-auto h-4 w-4" />
                            </button>
                            <output>{optionQty}</output>
                            <button
                              type="button"
                              disabled={!canIncrease}
                              aria-label={labels.increaseQty}
                              onClick={() => changeOptionQuantity(group, option, 1)}
                            >
                              <Plus className="mx-auto h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className="sf-choice"
                        data-checked={selected ? 'true' : 'false'}
                        onClick={() => handleToggleOption(group, option)}
                      >
                        <span className="sf-choice-mark sf-choice-mark--radio" aria-hidden />
                        <span className="flex-1 text-sm font-medium text-sf-ink">{option.name}</span>
                        <span className="text-[13px] tabular-nums text-sf-muted">
                          {optionPriceLabel(price, group, labels)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            <div className="mt-[18px]">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="m-0 text-sm font-semibold text-sf-ink">{labels.quantity}</h2>
              </div>
              <div className="sf-qty" role="group" aria-label={labels.quantity}>
                <button
                  type="button"
                  aria-label={labels.decreaseQty}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <output>{quantity}</output>
                <button
                  type="button"
                  aria-label={labels.increaseQty}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-sf-line bg-sf-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto w-full max-w-[520px] px-4 py-2.5">
          <button
            type="button"
            className="sf-btn sf-btn-block"
            disabled={!allRequiredMet}
            onClick={handleAdd}
          >
            {allRequiredMet
              ? `${labels.addToCart} · ${formatStorefrontAzn(totalPrice)}`
              : labels.selectRequired}
          </button>
        </div>
      </div>
    </div>
  );
}
