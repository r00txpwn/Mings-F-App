# Ming's POS Print Agent

Local HTTP service for kitchen label printing. Runs on the Windows counter PC (LAN only).

## Quick start

```bash
cd apps/pos-print-agent
npm install
cp config.example.json config.json
# Edit config.json — set printer TCP host/port (default 9100)
npm start
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Agent alive check |
| POST | `/print` | Queue label job `{ jobId, profile, items[] }` → 202 |
| POST | `/test-print` | Print sample label `{ profile }` |
| GET | `/queue` | Debug: recent jobs |
| GET | `/queue/:jobId` | Job status |

## Profiles

- `escpos_80mm` — 80mm thermal (ESC/POS)
- `zpl_58mm` — 58mm ZPL label
- `zpl_40x30` — 40×30mm ZPL label

Jobs persist in `queue.db` and retry every 5s until the printer ACKs.

## POS Settings

In `pos.mings.az` → Settings, set **Print agent URL** to `http://127.0.0.1:9310` (or LAN IP of the PC running this agent).
