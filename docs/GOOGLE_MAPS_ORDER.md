# Google Maps — `/order` delivery address

When `VITE_GOOGLE_MAPS_API_KEY` is set in `.env`, checkout (**Delivery**) shows:

1. **Search** — Google Places autocomplete (biased to Azerbaijan).
2. **Map** — tap anywhere to move the pin; **drag the pin** to fine-tune.
3. **Address** — text area fills from the pin (you can edit details).

Latitude/longitude from the pin are used for **delivery zones** (same as before).

## Google Cloud setup

1. Create a project → **APIs & Services** → enable:
   - **Maps JavaScript API**
   - **Places API** (legacy Places used by the Autocomplete widget)
   - **Geocoding API**
2. **Credentials** → create an **API key** (browser).
3. **Restrict key** → **Application restrictions** → *HTTP referrers*:
   - `http://localhost:5173/*`
   - `http://127.0.0.1:4176/*` (local storefront preview)
   - `https://order.mings.az/*`
   - `https://*.vercel.app/*` (preview deploys)
4. **API restrictions** → restrict to the three APIs above.

Add to `.env`:

```env
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

Rebuild/restart `npm run dev` after changing env.

## Without a key

If the variable is unset, customers still get the **text area** plus a short note — same flow as before (manual address + **Use my location**).
