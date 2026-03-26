# Supabase Phone Auth + Twilio (SMS OTP)

The online order **Account** tab supports **SMS sign-in** using Supabase Auth’s phone provider. Twilio is **not** wired in the frontend; you configure it in the **Supabase project** (or pass Twilio credentials via Supabase’s integration — you do **not** put Twilio secrets in this Vite app).

## 1. Twilio (your account)

1. Create a [Twilio](https://www.twilio.com/) account and buy a phone number capable of **SMS**.
2. Note:
   - **Account SID**
   - **Auth token**
   - **Messaging Service SID** (recommended) or the SMS-capable **From** number

You can use your existing Twilio APIs/credentials; Supabase only needs the values below in its dashboard.

## 2. Supabase Dashboard

1. Open **Authentication → Providers → Phone**.
2. Enable **Phone provider**.
3. Set **SMS provider** to **Twilio** (or the option your project offers).
4. Enter:
   - Twilio **Account SID**
   - Twilio **Auth token**
   - **Message service SID** or **sender phone number** (per Supabase UI labels).

5. Under **Authentication → URL configuration**, set **Site URL** to your deployed origin (e.g. `https://yourdomain.com`) so redirects and OTP flows behave correctly.

6. Optional: **Rate limits** and test phone numbers in Twilio / Supabase for development.

## 3. App environment

The client only needs the usual:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

No Twilio keys in `.env` — the anon key calls Supabase Auth; Supabase sends SMS via Twilio server-side.

## 4. User experience

- Users enter a number in **E.164** (e.g. `+994501234567`). The app normalizes common Azerbaijan formats (`050…` → `+99450…`).
- After **Send code**, they enter the OTP from SMS and tap **Verify & sign in**.
- Email + password remains available under the **Email** tab for customers who prefer it.

## 5. Staff (admin) login

The main cockpit at `/` still uses **email + password** for staff. SMS OTP is intended for **customers** on `/order`; staff accounts remain rows in `public.users` as before.

## Troubleshooting

| Issue | Check |
|--------|--------|
| SMS not received | Twilio number/Messaging Service, geo permissions, trial account limits |
| `Invalid phone` | E.164 with country code; Twilio must allow destination country |
| OTP rejected | Clock skew rare; ensure full code; check Supabase Auth logs |
| Customer can’t save profile | RLS on `customer_profiles`; user must be logged in |
| **Twilio 20404** — `.../Accounts/AC.../Messages.json was not found` | **Wrong Account SID or Auth token** in Supabase (typo, extra space, token from another account). Re-copy **Account SID** (`AC` + 32 hex) and **Auth token** from [Twilio Console → Account](https://console.twilio.com/). Confirm **Messaging Service SID** (`MG…`) or **From** number belongs to that same account. |

For Twilio-specific delivery errors, use the **Twilio Console → Monitor → Logs**.
