# Storefront visual system (menu + item)

Customer storefront (`order.mings.az` / `/order`) menu browse and item customize follow the approved mid-fidelity wireframes: Chipotle structure, Panda Express category chips, Domino’s-clear customize. Light neutrals and one lacquer-red accent. No neon, stickers, dark/pink MVP, or letter tiles.

## Tokens

Source of truth is the wireframe `:root` (copied into `.sf-shell` CSS variables and Tailwind `theme.extend.colors.sf`):

| Token | Value |
|---|---|
| `--sf-bg` | `#f4f1ec` |
| `--sf-surface` | `#ffffff` |
| `--sf-ink` | `#1c1917` |
| `--sf-muted` | `#6d675f` |
| `--sf-line` / `--sf-line-strong` | `#e4dfd6` / `#cfc8bc` |
| `--sf-photo` / `--sf-photo-label` | `#d9d3c9` / `#8a8378` |
| `--sf-accent` / hover / soft | `#7a1f1f` / `#611818` / `#f4eceb` |
| `--sf-ok` | `#2c6a3c` |

Scoped to `.sf-shell` so staff cockpit, kiosk, KDS, POS, Order Manager, and this PR’s cart/checkout/tracking screens keep their existing chrome.

## Surfaces in this pass

- **Menu browse** — wordmark, Takeaway \| Delivery, EN/AZ/RU chips, account, cart, hours strip, category chips, search, photo/name/desc/price/Add cards, sticky cart bar.
- **Item customize** — back, large photo (or gray Photo placeholder), name/desc/price, required radios, optional add-ons, qty, live-price Add to cart.

Cart, checkout, and tracking stay on the previous dark `ming-*` chrome until later PRs. Payment trust from [#32](https://github.com/r00txpwn/Mings-F-App/pull/32) (`checkoutUrl` fail-closed, return flags, cart clear only after `saleRowIsPaid`) is unchanged.
