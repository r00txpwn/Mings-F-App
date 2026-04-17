# Adding a New Payment Provider

## Overview

Mings uses cash/COD as default payment methods. Online card payment requires two edge
functions and a small frontend addition:

- `<provider>-create-payment` — creates a payment record and returns a hosted checkout URL
- `<provider>-webhook` — receives the provider's server-to-server callback and updates
  payment status

## Integration Checklist

### 1. Types (`src/types/online.ts`)

Add the new literal to `OnlinePaymentMethod`:

```typescript
export type OnlinePaymentMethod = 'cash' | 'cod' | '<provider>';
```

Add the new `nextStep` value to `OnlineOrderCreateResponse`:

```typescript
nextStep: 'track' | '<provider>-create-payment';
```

---

### 2. Edge Function: `<provider>-create-payment`

**File:** `supabase/functions/<provider>-create-payment/index.ts`

- Input (JSON body): `{ saleId: string }` — caller sends the user's JWT as `Authorization: Bearer <token>`
- Action:
  1. Verify JWT to get `customerUserId` (optional but recommended)
  2. Look up the sale from `sales` table to get `total_price`, `display_number`, etc.
  3. Insert a row into `online_payments`: `{ sale_id, provider: '<provider>', status: 'pending', amount }`
  4. Call the provider's payment initiation API
  5. Return `{ checkoutUrl: string }` on success
- Sandbox fallback: if env keys are not set, return a placeholder URL for testing
- Set `sales.payment_status = 'pending'` (already done by `online-order-create` — confirm the
  provider needs this)

**Register in `supabase/config.toml`:**

```toml
[functions."<provider>-create-payment"]
verify_jwt = false
```

(`verify_jwt = false` is required because browsers send a CORS OPTIONS preflight without a JWT.)

---

### 3. Edge Function: `<provider>-webhook`

**File:** `supabase/functions/<provider>-webhook/index.ts`

- Verify the provider's signature on each incoming request (reject if mismatch)
- Decode payload
- On payment success:
  - `UPDATE sales SET payment_status = 'paid' WHERE id = saleId`
  - For delivery orders, fire `wolt-drive-create` (fire-and-forget):
    ```typescript
    EdgeRuntime.waitUntil(
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/wolt-drive-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ saleId }),
      }).catch(() => {})
    );
    ```
- On payment failure: `UPDATE sales SET payment_status = 'failed'`
- Return `200 OK` for all recognized events (even failures) so the provider stops retrying

**Register the webhook URL** in the provider's dashboard:

```
https://<supabase-project>.supabase.co/functions/v1/<provider>-webhook
```

---

### 4. Frontend — `src/order/OrderApp.tsx`

**Add payment card** to the grid (around line 778):

```typescript
{ value: '<provider>', icon: '💳', label: t.orderPayCardLabel },
```

Change the grid back to `grid-cols-3`.

**Add checkout redirect block** after `online-order-create` resolves (around line 283):

```typescript
if (data.nextStep === '<provider>-create-payment' && paymentMethod === '<provider>') {
  const pay = await invokeEdgeFunction<{ saleId: string }, { checkoutUrl?: string }>(
    '<provider>-create-payment',
    { saleId: data.saleId },
    accessToken
  );
  if (!pay.ok) {
    setSubmitError(pay.error ?? 'Payment init failed');
    setSubmitting(false);
    return;
  }
  if (pay.data?.checkoutUrl) {
    window.location.href = pay.data.checkoutUrl;
    return;
  }
}
```

---

### 5. `supabase/functions/online-order-create/index.ts`

Update the `PaymentMethod` type:

```typescript
type PaymentMethod = 'cash' | 'cod' | '<provider>';
```

Set `payment_status = 'pending'` for the new provider:

```typescript
const paymentStatus = paymentMethod === '<provider>' ? 'pending' : 'unpaid';
```

Update `nextStep` in the response:

```typescript
nextStep: paymentMethod === '<provider>' ? '<provider>-create-payment' : 'track',
```

Remove (or keep disabled) the Wolt Drive auto-dispatch for delivery orders if payment must
complete first — move that trigger into the webhook instead.

---

### 6. Translations (`src/translations.ts`)

Add `orderPayCardLabel` back to the `Translations` interface and all 3 locales (en/az/ru):

```typescript
// Interface
orderPayCardLabel: string;

// en
orderPayCardLabel: 'Card (<ProviderName>)',
// az
orderPayCardLabel: 'Kart (<ProviderName>)',
// ru
orderPayCardLabel: 'Карта (<ProviderName>)',
```

---

### 7. Secrets (Supabase Dashboard → Project Settings → Edge Functions → Secrets)

Add the provider credentials:

| Key | Description |
|---|---|
| `<PROVIDER>_PUBLIC_KEY` | Merchant ID / public API key |
| `<PROVIDER>_PRIVATE_KEY` | Secret signing key — never expose to browser |
| `APP_BASE_URL` | Public URL of the ordering app, e.g. `https://order.mings.az` — used for payment return/cancel redirect URLs |

---

## Signature Reference (Epoint — removed)

The removed Epoint integration used SHA-1 raw binary HMAC:

```
signature = base64(sha1_raw(privateKey + data + privateKey))
data       = base64(JSON.stringify(payload))
```

See git history for `supabase/functions/_shared/epointSign.ts` for the exact Deno/Web Crypto
implementation.

---

## Database Tables

| Table | Relevant columns |
|---|---|
| `sales` | `payment_status`: `'unpaid' \| 'pending' \| 'paid' \| 'failed'` |
| `online_payments` | `sale_id`, `provider`, `provider_tx_id`, `amount`, `status`, `raw_response` |
