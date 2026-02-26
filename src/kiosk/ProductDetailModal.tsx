import { useState, useEffect, useMemo } from 'react';
import { X, Package, Minus, Plus, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Product, ModifierGroup, ModifierOption, SelectedModifiers } from '../lib/supabase';

interface ProductDetailModalProps {
  product: Product;
  onAddToCart: (product: Product, selectedModifiers: SelectedModifiers) => void;
  onClose: () => void;
}

export function ProductDetailModal({ product, onAddToCart, onClose }: ProductDetailModalProps) {
  const { t } = useLanguage();
  const [selections, setSelections] = useState<SelectedModifiers>({});
  const [quantity, setQuantity] = useState(1);
  const [closing, setClosing] = useState(false);

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
      const defaultOptions = group.modifier_options.filter(o => o.is_default);
      if (defaultOptions.length > 0) {
        defaults[group.id] = defaultOptions;
      }
    });
    setSelections(defaults);
  }, [groups]);

  const handleToggleOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelections(prev => {
      const current = prev[group.id] || [];
      const isSingleSelect = group.max_select === 1;

      if (isSingleSelect) {
        return { ...prev, [group.id]: [option] };
      }

      const isSelected = current.some(o => o.id === option.id);
      if (isSelected) {
        return { ...prev, [group.id]: current.filter(o => o.id !== option.id) };
      }

      if (current.length >= group.max_select) {
        return prev;
      }

      return { ...prev, [group.id]: [...current, option] };
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
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div
        className={`relative flex flex-col bg-gray-900 w-full h-full sm:max-w-lg sm:mx-auto sm:my-4 sm:rounded-2xl sm:h-auto sm:max-h-[92vh] transition-transform duration-200 ${
          closing ? 'translate-y-8' : 'translate-y-0'
        }`}
      >
        <div className="relative flex-shrink-0">
          {product.image_url ? (
            <div className="w-full h-56 sm:h-64 bg-gray-800 sm:rounded-t-2xl overflow-hidden">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full h-40 bg-gray-800 sm:rounded-t-2xl flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
            {product.description && (
              <p className="text-gray-400 text-sm mb-3">{product.description}</p>
            )}
            <p className="text-emerald-400 text-xl font-bold">₼{Number(product.selling_price).toFixed(2)}</p>
          </div>

          {groups.length > 0 && (
            <div className="space-y-1">
              {groups.map(group => {
                const selectedCount = (selections[group.id] || []).length;
                const isSingle = group.max_select === 1;
                return (
                  <div key={group.id} className="px-5 py-4 border-t border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold">{group.name}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {isSingle ? t.chooseOne : `${t.chooseUpTo} ${group.max_select}`}
                          {group.is_required && (
                            <span className="ml-2 text-red-400">({t.required})</span>
                          )}
                        </p>
                      </div>
                      {!isSingle && group.max_select > 1 && (
                        <span className="text-xs text-gray-500">{selectedCount}/{group.max_select}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.modifier_options.map(option => {
                        const selected = isOptionSelected(group.id, option.id);
                        const atMax = !isSingle && selectedCount >= group.max_select && !selected;
                        return (
                          <button
                            key={option.id}
                            onClick={() => !atMax && handleToggleOption(group, option)}
                            disabled={atMax}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${
                              selected
                                ? 'bg-emerald-900/30 border-2 border-emerald-500'
                                : atMax
                                  ? 'bg-gray-800/50 border-2 border-gray-800 opacity-40'
                                  : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600 active:scale-[0.98]'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              selected
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-gray-600'
                            }`}>
                              {selected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            {option.image_url && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                                <img src={option.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <span className="flex-1 text-left text-white text-sm font-medium">{option.name}</span>
                            <span className={`text-sm flex-shrink-0 ${
                              Number(option.price_adjustment) > 0
                                ? 'text-emerald-400 font-semibold'
                                : 'text-gray-500'
                            }`}>
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

        <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900 sm:rounded-b-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-white font-bold w-10 text-center text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!allRequiredMet}
              className={`flex-1 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 min-h-[56px] ${
                allRequiredMet
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {allRequiredMet
                ? `${t.addToCart} - ₼${totalPrice.toFixed(2)}`
                : t.selectRequired
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
