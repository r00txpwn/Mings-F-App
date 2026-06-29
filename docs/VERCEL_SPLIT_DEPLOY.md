# Deploy — two Vercel projects (split builds)

This repo uses **two** Vercel projects. `.vercel/project.json` links to **one** project at a time.

| Domain | Vercel project | Config file | Build |
|--------|----------------|-------------|-------|
| sp.mings.az | `mings-f-app` | `vercel.staff.json` | `npm run build:staff` |
| order.mings.az | `mings-order` | `vercel.storefront.json` | `npm run build:storefront` |

## Staff (sp.mings.az)

```bash
vercel link --project mings-f-app --yes
vercel deploy --prod --yes --local-config vercel.staff.json
```

## Storefront (order.mings.az)

```bash
vercel link --project mings-order --yes
vercel deploy --prod --yes --local-config vercel.storefront.json
```

**Warning:** deploying with the wrong `--local-config` to the wrong linked project will ship the wrong bundle to a customer domain. Always confirm `Retrieving project…` shows the intended project name before the build starts.
