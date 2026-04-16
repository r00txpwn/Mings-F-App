# Epoint API Integration Wiki (Comprehensive)

This document is an exhaustive technical specification for the **Epoint.az** electronic payment platform integration, covering all features described in the official API documentation (v1.0.3).

---

## 1. Authentication & Security
Communication with Epoint requires a `public_key` (Merchant ID) and a `private_key` (Secret Key).

### Signature Formation
Every request must include a `data` parameter and a `signature`.
- **data**: A JSON string of parameters, encoded in Base64: `base64_encode(json_string)`.
- **signature**: A unique signature generated using the formula:
  `base64_encode(sha1(private_key + data + private_key, true))`

> **Note**: The SHA1 hash must be the raw binary output (20 characters) before Base64 encoding.

### Callback Authentication
To verify responses at your `result_url`:
1. Generate a signature locally using the received `data` and your `private_key`.
2. Compare it with the `signature` sent by Epoint.
3. Decode data: `json_decode(base64_decode(data))`.

---

## 2. Core Payment Operations

### 2.1 Standard Payment (Checkout)
- **Redirect URL**: `https://epoint.az/api/1/checkout` (Use POST to redirect user)
- **Request URL**: `https://epoint.az/api/1/request` (Use POST for JSON response with `redirect_url`)
- **Required Params**: `public_key`, `amount`, `currency` (AZN), `language` (az, en, ru), `order_id`.

### 2.2 Payment Status
- **Endpoint**: `https://epoint.az/api/1/get-status`
- **Statuses**:
    - `new`: Registered in Epoint.
    - `success`: Payment completed.
    - `returned`: Refunded.
    - `error`: Payment failed.
    - `server_error`: Internal check error.

### 2.3 Cancel & Refund
- **Refund (Disbursement)**: `https://epoint.az/api/1/refund-request`
- **Reverse (Cancellation)**: `https://epoint.az/api/1/reverse` (Supports partial refunds via `amount` parameter).

### 2.4 Pre-Authorization
1. **Request**: `https://epoint.az/api/1/pre-auth-request` (Holds funds on card).
2. **Complete**: `https://epoint.az/api/1/pre-auth-complete` (Must be called to move funds to balance).

---

## 3. Advanced Payment Features

### 3.1 Saved Cards (One-Click)
- **Registration Only**: `https://epoint.az/api/1/card-registration`
- **Pay & Save**: `https://epoint.az/api/1/card-registration-with-pay`
- **Execute Payment**: `https://epoint.az/api/1/execute-pay` (Uses `card_id` obtained during registration).

### 3.2 Split Payments
Settles funds across two merchants simultaneously.
- **Request**: `https://epoint.az/api/1/split-request`
- **Execution (Stored Card)**: `https://epoint.az/api/1/split-execute-pay`
- **Registration with Pay**: `https://epoint.az/api/1/split-card-registration-with-pay`
- **Key Params**: `split_user` (Secondary merchant ID), `split_amount`.

### 3.3 Wallets
- **Get Wallet List**: `https://epoint.az/api/1/wallet/status`
- **Pay via Wallet**: `https://epoint.az/api/1/wallet/payment`

---

## 4. Digital Wallets & Invoices

### 4.1 Apple Pay & Google Pay
- **Web Widget**: `https://epoint.az/api/1/token/widget` returns a `widget_url` to load in an iframe.
- **Mobile Apps (Google Pay)**: Requires native integration and subsequent Merchant ID approval from Epoint.

### 4.2 Invoices API
All invoice endpoints are under `https://epoint.az/api/1`:
- `/invoices/create`: Generate an invoice.
- `/invoices/update`: Modify invoice details.
- `/invoices/view` / `/invoices/list`: Retrieval.
- `/invoices/send-sms` / `/invoices/send-email`: Direct delivery to customer.

---

## 5. Technical Infrastructure

### 5.1 Recommended Database Schema
| Table | Key Columns |
| :--- | :--- |
| `payment_transactions` | `id`, `order_id`, `epoint_transaction_id`, `amount`, `status`, `rrn`, `bank_response_code` |
| `payment_saved_cards` | `id`, `user_id`, `card_id`, `card_mask`, `card_name`, `is_default` |

### 5.2 Bank Response Codes
- **000**: Confirmed/Success.
- **116**: Insufficient Funds.
- **102**: Suspected Fraud.
- **101**: Card Expired.

### 5.3 Health Check
Verify Epoint availability:
`GET https://epoint.az/api/heartbeat` -> `{"status": "ok"}`
