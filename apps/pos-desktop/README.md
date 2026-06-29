# Ming's POS Desktop (Electron)

Optional Windows desktop shell that loads `https://pos.mings.az` and spawns the local print agent on startup.

## Development

```bash
cd apps/pos-desktop
npm install
npm start
```

Set `POS_URL=http://127.0.0.1:4175/pos` for local preview testing.

## Build installer

```bash
cd apps/pos-print-agent && npm install
cd ../pos-desktop && npm install
npm run dist
```

Output: `apps/pos-desktop/dist/Ming's POS Setup.exe`

On first run, POS Settings should use `http://127.0.0.1:9310` (agent started by Electron).
