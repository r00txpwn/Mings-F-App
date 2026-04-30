import { useState, useEffect, useMemo } from 'react';
import { X, Package, Minus, Plus, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, ModifierGroup, ModifierOption, SelectedModifiers } from '../lib/supabase';
import {
  effectiveModifierGroupMaxSelect,
  isSingleSelectModifierGroup,
} from '../lib/modifierGroupConstraints';
import { formatMoney, formatMoneyWithSymbol, formatSignedMoney } from '../lib/money';

function dishInitialFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'M';
  const first = [...trimmed][0];
  return first ? first.toLocaleUpperCase() : 'M';
}

function ProductDetailModalCloseButton({
  isOrderTheme,
  palette,
  onClose,
  positionClassName,
}: {
  isOrderTheme: boolean;
  palette: { text: string };
  onClose: () => void;
  positionClassName: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={`absolute ${positionClassName} flex h-10 w-10 items-center justify-center rounded-full transition-colors`}
      style={{
        backgroundColor: isOrderTheme ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.5)',
        color: isOrderTheme ? '#281414' : palette.text,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = isOrderTheme ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,0.7)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = isOrderTheme ? 'rgba(255,255,255,0.86)' : 'rgba(0,0,0,0.5)')
      }
    >
      <X className="w-5 h-5" />
    </button>
  );
}

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
  const palette = isOrderTheme
    ? {
        panelBg: '#ffffff',
        heroBg: '#f7efe0',
        text: '#281414',
        muted: 'rgba(40,20,20,0.62)',
        accent: '#f04646',
        border: 'rgba(40,20,20,0.12)',
        tileBg: 'rgba(180,230,220,0.34)',
        selectedTileBg: 'rgba(240,70,70,0.12)',
        controlBg: 'rgba(40,20,20,0.07)',
        footerBg: 'rgba(255,255,255,0.94)',
      }
    : {
        panelBg: 'var(--kiosk-card)',
        heroBg: '#383838',
        text: 'var(--kiosk-white)',
        muted: 'var(--kiosk-smoke)',
        accent: 'var(--kiosk-primary)',
        border: 'var(--kiosk-border)',
        tileBg: 'rgba(255,255,255,0.04)',
        selectedTileBg: 'rgba(214,87,69,0.12)',
        controlBg: '#383838',
        footerBg: 'rgba(42, 42, 43, 0.97)',
      };

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
    if (isOrderTheme) return formatSignedMoney(price);
    return price > 0 ? `+₼${formatMoney(price)}` : `-₼${formatMoney(Math.abs(price))}`;
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

  const orderMissingPhotoHero = isOrderTheme && !product.image_url;

  return (
    <div
      className={`fixed inset-0 z-50 flex h-svh w-full flex-col transition-opacity duration-200 ${isOrderTheme ? 'max-sm:justify-end' : ''} ${isOrderTheme ? '' : 'font-montserrat'} ${closing ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{
          background: isOrderTheme
            ? 'radial-gradient(1200px 520px at 50% -20%, rgba(240,70,70,0.18), transparent 58%), rgba(40,20,20,0.42)'
            : 'radial-gradient(900px 420px at 8% -8%, rgba(225, 29, 72, 0.22), transparent 60%), rgba(11, 11, 13, 0.84)',
        }}
        onClick={handleClose}
      />

      {/* Modal panel — order /order: mobile bottom sheet; kiosk + desktop unchanged */}
      <div
        className={[
          'relative flex w-full flex-col overflow-hidden transition-transform duration-200',
          closing ? 'translate-y-8' : 'translate-y-0',
          isOrderTheme
            ? 'border border-black/10 shadow-[10px_10px_0_rgba(40,20,20,0.2)] max-sm:mt-auto max-sm:mx-0 max-sm:mb-0 max-sm:min-h-0 max-sm:max-h-[min(96dvh,100svh)] max-sm:rounded-b-none max-sm:rounded-t-[24px] sm:mx-auto sm:my-4 sm:h-auto sm:w-full sm:max-h-[92vh] sm:max-w-lg sm:rounded-[24px]'
            : 'mx-2 my-2 h-[calc(100vh-1rem)] w-auto sm:mx-auto sm:my-4 sm:h-auto sm:max-h-[92vh] sm:max-w-lg',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        style={{
          backgroundColor: palette.panelBg,
          ...(!isOrderTheme ? { borderRadius: '22px' } : {}),
        }}
      >
        {/* Product image (kiosk keeps hero placeholder; order collapses to branded strip when no photo) */}
        <div className="relative flex-shrink-0">
          {product.image_url ? (
            <>
              <div
                className="h-56 w-full overflow-hidden sm:h-64"
                style={{ borderRadius: '22px 22px 0 0', backgroundColor: palette.heroBg }}
              >
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <ProductDetailModalCloseButton
                isOrderTheme={isOrderTheme}
                palette={palette}
                onClose={handleClose}
                positionClassName="top-4 right-4"
              />
            </>
          ) : orderMissingPhotoHero ? (
            <>
              <div
                className="relative w-full overflow-hidden border-b border-black/10"
                style={{
                  borderRadius: '24px 24px 0 0',
                  background: 'linear-gradient(118deg, #fff7eb 0%, #b4e6dc 54%, #ffffff 100%)',
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: 'radial-gradient(95% 120% at 100% 0%, rgba(240,70,70,0.22), transparent 55%)',
                    opacity: 0.9,
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent opacity-80" />
                <div className="relative flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3">
                  <div
                    className="ming-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-[4px_4px_0_var(--order-ink)]"
                    style={{ background: 'linear-gradient(145deg, #f04646 0%, #fa963c 100%)' }}
                  >
                    {dishInitialFromName(product.name)}
                  </div>
                  <div className="min-w-0 flex-1 pr-12">
                    <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--order-coral)]">
                      {t.orderCheckoutBrand}
                    </p>
                    <p className="text-[11px] font-semibold leading-snug text-[rgba(40,20,20,0.62)]">{t.orderProductNoPhotoCaption}</p>
                  </div>
                </div>
              </div>
              <ProductDetailModalCloseButton
                isOrderTheme={isOrderTheme}
                palette={palette}
                onClose={handleClose}
                positionClassName="top-2.5 right-3 sm:top-3 sm:right-4"
              />
            </>
          ) : (
            <>
              <div
                className="flex h-40 w-full items-center justify-center"
                style={{ borderRadius: '22px 22px 0 0', backgroundColor: palette.heroBg }}
              >
                <Package className="h-16 w-16" style={{ color: palette.muted }} />
              </div>
              <ProductDetailModalCloseButton
                isOrderTheme={isOrderTheme}
                palette={palette}
                onClose={handleClose}
                positionClassName="top-4 right-4"
              />
            </>
          )}
        </div>

        {/* Scrollable content */}
        <div className="ming-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Product info */}
          <div className={orderMissingPhotoHero ? 'p-5 pt-3' : 'p-5'}>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: palette.text }}
            >
              {product.name}
            </h2>
            {product.is_halal ? (
              <span className="mb-2 inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                {t.halal}
              </span>
            ) : null}
            {product.description && (
              <p className="text-sm mb-3" style={{ color: palette.muted }}>{product.description}</p>
            )}
            <p
              className="text-xl font-bold"
              style={{ color: palette.accent }}
            >
              {isOrderTheme
                ? formatMoneyWithSymbol(product.selling_price)
                : `₼${formatMoney(product.selling_price)}`}
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
                    style={{ borderTop: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3
                          className="font-semibold"
                          style={{ color: palette.text }}
                        >
                          {group.name}
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: palette.muted }}>
                          {isSingle ? t.chooseOne : `${t.chooseUpTo} ${maxSel}`}
                          {group.is_required && (
                            <span className="ml-2" style={{ color: palette.accent }}>({t.required})</span>
                          )}
                        </p>
                      </div>
                      {!isSingle && maxSel > 1 && (
                        <span className="text-xs" style={{ color: palette.muted }}>
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
                                backgroundColor: optionQty > 0 ? palette.selectedTileBg : palette.tileBg,
                                outline: optionQty > 0 ? `2px solid ${palette.accent}` : '2px solid transparent',
                                border: `1px solid ${palette.border}`,
                              }}
                            >
                              {option.image_url && (
                                <div
                                  className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                                  style={{ backgroundColor: palette.controlBg }}
                                >
                                  <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
                                </div>
                              )}

                              <span
                                className="flex-1 text-left text-sm font-medium"
                                style={{ color: palette.text }}
                              >
                                {option.name}
                              </span>
                              <span
                                className="text-sm flex-shrink-0 font-semibold"
                                style={{
                                  color: Number(option.price_adjustment) > 0
                                    ? palette.accent
                                    : palette.muted,
                                }}
                              >
                                {formatPrice(Number(option.price_adjustment))}
                              </span>
                              <div
                                className="flex items-center rounded-xl p-1 flex-shrink-0"
                                style={{ backgroundColor: palette.controlBg }}
                              >
                                <button
                                  type="button"
                                  disabled={!canDecrease}
                                  onClick={() => changeOptionQuantity(group, option, -1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                                  style={{ color: palette.text }}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span
                                  className="w-7 text-center text-sm font-bold"
                                  style={{ color: palette.text }}
                                >
                                  {optionQty}
                                </span>
                                <button
                                  type="button"
                                  disabled={!canIncrease}
                                  onClick={() => changeOptionQuantity(group, option, 1)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                                  style={{ color: palette.text }}
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
                              backgroundColor: selected ? palette.selectedTileBg : palette.tileBg,
                              outline: selected
                                ? `2px solid ${palette.accent}`
                                : atMax
                                  ? '2px solid transparent'
                                  : '2px solid transparent',
                              border: `1px solid ${palette.border}`,
                              opacity: atMax ? 0.4 : 1,
                            }}
                          >
                            {/* Check indicator */}
                            <div
                              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                              style={{
                                backgroundColor: selected ? palette.accent : 'transparent',
                                borderColor: selected ? palette.accent : palette.muted,
                              }}
                            >
                              {selected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>

                            {/* Option image */}
                            {option.image_url && (
                              <div
                                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: palette.controlBg }}
                              >
                                <img src={option.image_url} alt={option.name} className="w-full h-full object-cover" />
                              </div>
                            )}

                            <span
                              className="flex-1 text-left text-sm font-medium"
                              style={{ color: palette.text }}
                            >
                              {option.name}
                            </span>
                            <span
                              className="text-sm flex-shrink-0 font-semibold"
                              style={{
                                color: Number(option.price_adjustment) > 0
                                  ? palette.accent
                                  : palette.muted,
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
          className={[
            'sticky bottom-0 z-10 flex-shrink-0 p-4',
            isOrderTheme ? 'max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            borderTop: `1px solid ${palette.border}`,
            backgroundColor: palette.footerBg,
            backdropFilter: 'blur(6px)',
            ...(!isOrderTheme ? { borderRadius: '0 0 22px 22px' } : {}),
          }}
        >
          <div className="flex items-center gap-4">
            {/* Quantity stepper */}
            <div
              className="flex items-center rounded-[18px] p-1"
              style={{ backgroundColor: palette.controlBg }}
            >
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: palette.text }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Minus className="w-5 h-5" />
              </button>
              <span
                className="font-bold w-10 text-center text-lg"
                style={{ color: palette.text }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
                style={{ color: palette.text }}
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
                backgroundColor: allRequiredMet ? palette.accent : palette.muted,
                cursor: allRequiredMet ? 'pointer' : 'not-allowed',
                boxShadow: isOrderTheme && allRequiredMet ? '5px 5px 0 #281414' : undefined,
              }}
              onMouseEnter={e => { if (allRequiredMet) e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
            >
              {allRequiredMet
                ? `${t.addToCart} — ${
                    isOrderTheme ? formatMoneyWithSymbol(totalPrice) : `₼${formatMoney(totalPrice)}`
                  }`
                : t.selectRequired
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
