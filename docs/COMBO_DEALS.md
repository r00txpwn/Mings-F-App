# Combo Deals

Combo deals in Ming's are bundled pricing products designed for fast upsell in QSR flow.

## Principles

- Combo price uses fixed `combo_deals.base_price`.
- Combo components are selected from required single-select groups.
- Modifiers can be chosen per component, but combo total still uses fixed base price.
- Combo lines are not part of default discount arithmetic.
- Discount config fields can be stored on combos for future pricing modes, but defaults remain disabled.

## Data model

## Catalog tables

- `combo_deals`
  - `id`, `name`, `base_price`, `is_active`, `image_url`, `sort_order`
  - `discount_enabled`, `discount_type ('percent'|'fixed')`, `discount_value`, `apply_discount_to_modifiers`
- `combo_groups`
  - `id`, `combo_id`, `name`, `selection_type='single'`, `required`, `sort_order`
- `combo_group_items`
  - `id`, `group_id`, `menu_item_id`, `price_adjustment`

## Product upsell mapping

- `products.combo_upsell_eligible` enables "make it a combo" prompt after adding a product.
- `products.upsell_combo_id` points to the specific combo to offer.
  - If missing, frontend falls back to the first combo containing that product.

## Order persistence

Combo lines are saved on `sale_items`:

- `is_combo = true`
- `combo_id`
- `combo_selections` JSON payload:

```json
{
  "combo": "Ming's Combo",
  "items": [
    { "group": "Noodle", "item": "Chicken Noodle", "itemId": "..." },
    { "group": "Side", "item": "Spring Rolls", "itemId": "...", "modifiers": ["Extra sauce"] },
    { "group": "Drink", "item": "Iced Tea", "itemId": "..." }
  ]
}
```

Selected component modifiers are also written to `sale_item_modifiers` for kitchen visibility.

## Customer flow (`order.mings.az`)

- Combo cards appear in the top strip with price and optional savings badge.
- Upsell popup appears after eligible items: "Make it {combo} for +X".
- Combo builder is step-based by group, with default preselect for speed.
- Component modifiers are selectable inline.

Key files:

- `src/order/OrderApp.tsx`
- `src/order/ComboBuilder.tsx`
- `src/types/orderCart.ts`
- `supabase/functions/online-order-create/index.ts`

## Staff management (`sp.mings.az/combos`)

`src/screens/CombosScreen.tsx` supports:

- Create/edit/toggle/delete combo deals.
- Manage groups per combo.
- Manage group items and `price_adjustment`.
- Manage product upsell mapping (`combo_upsell_eligible`, `upsell_combo_id`).

## KDS and tracking rendering

- KDS and tracking render combo lines grouped by combo, then component lines.
- No price clutter in grouped combo render.
- Selected modifier names for components are shown under each component when present.

Key files:

- `src/kds/OrderCard.tsx`
- `src/order/TrackingApp.tsx`
