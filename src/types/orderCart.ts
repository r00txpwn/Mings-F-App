import type { Product, SelectedModifiers } from '../lib/supabase';

export type OrderCartLine =
  | {
      kind: 'product';
      product: Product;
      quantity: number;
      notes: string;
      selectedModifiers: SelectedModifiers;
      cartItemKey: string;
    }
  | {
      kind: 'combo';
      comboId: string;
      comboName: string;
      basePrice: number;
      quantity: number;
      selections: Array<{
        groupId: string;
        itemId: string;
        groupName: string;
        itemName: string;
        modifierOptionIds: string[];
        modifierNames: string[];
      }>;
      cartItemKey: string;
    };
