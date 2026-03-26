Mings-F-App

## Local production preview

**One command (build + serve production bundle):**

```bash
npm run deploy:local
```

Runs `npm run build` then `vite preview` on **127.0.0.1**. Default port is **4173**; if it’s busy, Vite picks the next free port (check the terminal for `Local: http://127.0.0.1:…`).

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for Vercel/Netlify/Supabase CLI steps. Production build: `npm run build` → `dist/`.
