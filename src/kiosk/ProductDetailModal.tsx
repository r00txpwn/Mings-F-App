import { useState, useEffect, useMemo } from 'react';
import { X, Package, Minus, Plus, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, ModifierGroup, ModifierOption, SelectedModifiers } from '../lib/supabase';
import {
  effectiveModifierGroupMaxSelect,
  isSingleSelectModifierGroup,
} from '../lib/modifierGroupConstraints';

interface ProductDetailModalProps {
  product: Product;
  onAddToCart: (product: Product, selectedModifiers: SelectedModifiers) => void;
  onClose: () => void;
  theme?: 'kiosk' | 'order';
}

export function ProductDetailModal({ product, onAddToCart, onClose, theme = 'kiosk' }: ProductDetailModalProps) {
  const { t } = useLanguage();
  const [selections, setSelections] = useState<SelectedModifiers>({});
  const [quantity, setQuantity] = useState(1);
  const [closing, setClosing] = useState(false);
  const isOrderTheme = theme === 'order';

  const groups = useMemo(() => {
    return (product.modifier_groups || [])
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(g => ({
        ...g,
        modifier_options: (g.modifier_options || [])
          .filter(o => o.is_available)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      }));
  }, [product.modifier_groups]);

  useEffect(() => {
    const defaults: SelectedModifiers = {};
    groups.forEach(group => {
      const maxSel = effectiveModifierGroupMaxSelect(group);
      const minSel = Math.max(0, Number(group.min_select ?? 0));
      const isSingleSelect = isSingleSelectModifierGroup(group);
      const defaultOptions = group.modifier_options.filter(o => o.is_default);
      if (defaultOptions.length === 0) return;

      // Keep optional multi-select groups explicit: do not silently pre-add extras.
      if (isSingleSelect) {
        defaults[group.id] = [defaultOptions[0]];
        return;
      }

      if (group.is_required && minSel > 0) {
        const count = Math.min(maxSel, minSel, defaultOptions.length);
        if (count > 0) {
          defaults[group.id] = defaultOptions.slice(0, count);
        }
      }
    });
    setSelections(defaults);
  }, [groups]);

  const handleToggleOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelections(prev => {
      const current = prev[group.id] || [];
      const maxSel = effectiveModifierGroupMaxSelect(group);
      const isSingleSelect = isSingleSelectModifierGroup(group);

      if (isSingleSelect) {
        return { ...prev, [group.id]: [option] };
      }

      const isSelected = current.some(o => o.id === option.id);
      if (isSelected) {
        return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
      }

      if (current.length >= maxSel) {
        return prev;
      }

      return { ...prev, [group.id]: [...current, option] };
    });
  };

  const getOptionQuantity = (groupId: string, optionId: string) => {
    return (selections[groupId] || []).filter((o) => o.id === optionId).length;
  };

  const changeOptionQuantity = (group: ModifierGroup, option: ModifierOption, delta: 1 | -1) => {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      const maxSel = effectiveModifierGroupMaxSelect(group);
      const isSingleSelect = isSingleSelectModifierGroup(group);
      if (isSingleSelect) return prev;

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

  const isOptionSelected = (groupId: string, optionId: string) => {
    return (selections[groupId] || []).some(o => o.id === optionId);
  };

  const allRequiredMet = groups.every(group => {
    if (!group.is_required) return true;
    const selected = selections[group.id] || [];
    return selected.length >= group.min_select;
  });

  const modifierTotal = Object.values(selections)
    .flat()
    .reduce((sum, opt) => sum + Number(opt.price_adjustment), 0);

  const itemPrice = Number(product.selling_price) + modifierTotal;
  const totalPrice = itemPrice * quantity;

  const formatPrice = (price: number) => {
    if (price === 0) return t.freeOption;
    return price > 0 ? `+₼${price.toFixed(2)}` : `-₼${Math.abs(price).toFixed(2)}`;
  };

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, { ...selections });
    }
    handleClose();
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-200 ${isOrderTheme ? '' : 'font-montserrat'} ${closing ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          background: isOrderTheme
            ? 'radial-gradient(1200px 520px at 50% -20%, rgba(225, 29, 72, 0.18), transparent 58%), rgba(11, 11, 13, 0.76)'
            : 'radial-gradient(900px 420px at 8% -8%, rgba(225, 29, 72, 0.22), transparent 60%), rgba(11, 11, 13, 0.84)',
        }}
        onClick={handleClose}
      />

      {/* Modal panel */}
            <div
        className={`relative mx-2 my-2 flex h-[calc(100vh-1rem)] w-auto flex-col overflow-hidden sm:mx-auto sm:my-4 sm:h-auto sm:w-full sm:max-w-lg sm:max-h-[92vh] transition-transform duration-200 ${isOrderTheme ? 'ming-card-raised border border-white/[0.08]' : ''} ${closing ? 'translate-y-8' : 'translate-y-0'}`}
              role="dialog"
              aria-modal="true"
              aria-label={product.name}
        style={{
          backgroundColor: isOrderTheme ? '#1f1f24' : 'var(--kiosk-card)',
          borderRadius: isOrderTheme ? '20px' : '22px',
        }}
      >
        {/* Product image */}
        <div className="relative flex-shrink-0">
          {product.image_url ? (
            <div
              className="w-full h-56 sm:h-64 overflow-hidden"
              style={{ borderRadius: '22px 22px 0 0', backgroundColor: '#383838' }}
            >
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-full h-40 flex items-center justify-center"
              style={{ borderRadius: '22px 22px 0 0', backgroundColor: '#383838' }}
            >
              <Package className="w-16 h-16" style={{ color: 'var(--kiosk-smoke)' }} />
            </div>
          )}
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isOrderTheme ? 'rgba(11,11,13,0.62)' : 'rgba(0,0,0,0.5)',
              color: 'var(--kiosk-white)',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = isOrderTheme ? 'rgba(11,11,13,0.82)' : 'rgba(0,0,0,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = isOrderTheme ? 'rgba(11,11,13,0.62)' : 'rgba(0,0,0,0.5)')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="ming-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Product info */}
          <div className="p-5">
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--kiosk-white)' }}
            >
              {product.name}
            </h2>
            {product.is_halal ? (
              <span className="mb-2 inline-flex rounded-full border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">
                {t.halal}
              </span>
            ) : null}
            {product.description && (
              <p className="text-sm mb-3" style={{ color: 'var(--kiosk-smoke)' }}>{product.description}</p>
            )}
            <p
              className="text-xl font-bold"
              style={{ color: 'var(--kiosk-primary)' }}
            >
              ₼{Number(product.selling_price).toFixed(2)}
            </p>
          </div>

          {/* Modifier groups */}
          {groups.length > 0 && (
            <div className="space-y-1">
              {groups.map(group => {
                const selectedCount = (selections[group.id] || []).length;
                const maxSel = effectiveModifierGroupMaxSelect(group);
                const isSingle = isSingleSelectModifierGroup(group);
                return (
                  <div
                    key={group.id}
                    className="px-5 py-4"
                    style={{ borderTop: '1px solid var(--kiosk-border)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3
                          className="font-semibold"
                          style={{ color: 'var(--kiosk-white)' }}
                        >
                          {group.name}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--kiosk-smoke)' }}>
                          {isSingle ? t.chooseOne : `${t.chooseUpTo} ${maxSel}`}
                          {group.is_required && (
                            <span className="ml-2" style={{ color: 'var(--kiosk-primary)' }}>({t.required})</span>
                          )}
                        </p>
                      </div>
                      {!isSingle && maxSel > 1 && (
                        <span className="text-xs" style={{ color: 'var(--kiosk-smoke)' }}>
                          {selectedCount}/{maxSel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.modifier_options.map(option => {
                        const selected = isOptionSelected(group.id, option.id);
                        const optionQty = getOptionQuantity(group.id, option.id);
                        const canIncrease = !isSingle && selectedCount < maxSel;
                        const canDecrease = !isSingle && optionQty > 0;

                        if (!isSingle) {
                          return (
                            <div
                              key={option.id}
                              className="w-full flex items-center gap-3 p-3.5 rounded-[18px] transition-all"
                              style={{
                                backgroundColor: optionQty > 0 ? 'rgba(214,87,69,0.12)' : 'rgba(255,255,255,0.04)',
                                outline: optionQty > 0 ? '2.5px solid var(--kiosk-primary)' : '2.5px solid transparent',
                              }}
                            >
                              {option.image_url && (
                                <div
                                  className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                                  style={{ backgroundColor: '#383838' }}
                                >
                                  <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
                                </div>
                              )}

                              <span
                                className="flex-1 text-left text-sm font-medium"
                                style={{ color: 'var(--kiosk-white)' }}
                              >
                                {option.name}
                              </span>
                              <span
                                className="text-sm flex-shrink-0 font-semibold"
                                style={{
                                  color: Number(option.price_adjustment) > 0
                                    ? 'var(--kiosk-primary)'
                                    : 'var(--kiosk-smoke)',
                                }}
                              >
                                {formatPrice(Number(option.price_adjustment))}
                              </span>
                              <div
                                className="flex items-center rounded-xl p-1 flex-shrink-0"
                                style={{ backgroundColor: '#383838' }}
                              >
                                <button
                                  type="button"
                                  disabled={!canDecrease}
                                  onClick={() => changeOptionQuantity(group, option, -1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                                  style={{ color: 'var(--kiosk-white)' }}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span
                                  className="w-7 text-center text-sm font-bold"
                                  style={{ color: 'var(--kiosk-white)' }}
                                >
                                  {optionQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={!canIncrease}
                                  onClick={() => changeOptionQuantity(group, option, 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                                  style={{ color: 'var(--kiosk-white)' }}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        }

                        const atMax = !isSingle && selectedCount >= maxSel && !selected;
                        return (
                          <button
                            key={option.id}
                            onClick={() => !atMax && handleToggleOption(group, option)}
                            disabled={atMax}
                            className="w-full flex items-center gap-3 p-3.5 rounded-[18px] transition-all"
                            style={{
                              backgroundColor: selected ? 'rgba(214,87,69,0.12)' : 'rgba(255,255,255,0.04)',
                              outline: selected
                                ? '2.5px solid var(--kiosk-primary)'
                                : atMax
                                  ? '2.5px solid transparent'
                                  : '2.5px solid transparent',
                              opacity: atMax ? 0.4 : 1,
                            }}
                          >
                            {/* Check indicator */}
                            <div
                              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                backgroundColor: selected ? 'var(--kiosk-primary)' : 'transparent',
                                borderColor: selected ? 'var(--kiosk-primary)' : 'var(--kiosk-smoke)',
                              }}
                            >
                              {selected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>

                            {/* Option image */}
                            {option.image_url && (
                              <div
                                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: '#383838' }}
                              >
                                <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
                              </div>
                            )}

                            <span
                              className="flex-1 text-left text-sm font-medium"
                              style={{ color: 'var(--kiosk-white)' }}
                            >
                              {option.name}
                            </span>
                            <span
                              className="text-sm flex-shrink-0 font-semibold"
                              style={{
                                color: Number(option.price_adjustment) > 0
                                  ? 'var(--kiosk-primary)'
                                  : 'var(--kiosk-smoke)',
                              }}
                            >
                              {formatPrice(Number(option.price_adjustment))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: qty stepper + add button */}
        <div
          className="sticky bottom-0 z-10 flex-shrink-0 p-4"
          style={{
            borderTop: '1px solid var(--kiosk-border)',
            borderRadius: '0 0 22px 22px',
            backgroundColor: 'rgba(42, 42, 43, 0.97)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Quantity stepper */}
            <div
              className="flex items-center rounded-[18px] p-1"
              style={{ backgroundColor: '#383838' }}
            >
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: 'var(--kiosk-white)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span
                className="font-bold w-10 text-center text-lg"
                style={{ color: 'var(--kiosk-white)' }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: 'var(--kiosk-white)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAdd}
              disabled={!allRequiredMet}
              className="flex-1 text-white py-4 rounded-[18px] font-bold text-lg transition-all flex items-center justify-center gap-2 min-h-[56px]"
              style={{
                backgroundColor: allRequiredMet ? 'var(--kiosk-primary)' : 'var(--kiosk-smoke)',
                cursor: allRequiredMet ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={e => { if (allRequiredMet) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              {allRequiredMet
                ? `${t.addToCart} — ₼${totalPrice.toFixed(2)}`
                : t.selectRequired
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
