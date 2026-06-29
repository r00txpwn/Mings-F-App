export type PosPrinterProfile = 'escpos_80mm' | 'zpl_58mm' | 'zpl_40x30';

const AGENT_URL_KEY = 'posPrintAgentUrl';
const PRINTER_PROFILE_KEY = 'posPrinterProfile';

const DEFAULT_AGENT_URL = 'http://127.0.0.1:9310';
const DEFAULT_PROFILE: PosPrinterProfile = 'escpos_80mm';

export function getPosPrintAgentUrl(): string {
  try {
    const stored = localStorage.getItem(AGENT_URL_KEY)?.trim();
    return stored || DEFAULT_AGENT_URL;
  } catch {
    return DEFAULT_AGENT_URL;
  }
}

export function setPosPrintAgentUrl(url: string): void {
  localStorage.setItem(AGENT_URL_KEY, url.trim() || DEFAULT_AGENT_URL);
}

export function getPosPrinterProfile(): PosPrinterProfile {
  try {
    const stored = localStorage.getItem(PRINTER_PROFILE_KEY) as PosPrinterProfile | null;
    if (stored === 'escpos_80mm' || stored === 'zpl_58mm' || stored === 'zpl_40x30') {
      return stored;
    }
    return DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function setPosPrinterProfile(profile: PosPrinterProfile): void {
  localStorage.setItem(PRINTER_PROFILE_KEY, profile);
}
