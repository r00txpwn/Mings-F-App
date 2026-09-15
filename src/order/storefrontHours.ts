import {
  getBakuWallParts,
  getKitchenStatus,
  getSessionEndBaku,
  type KitchenAcceptanceStatus,
  type KitchenSettings,
} from '../lib/kitchenAcceptance';
import { formatVenueHoursLine } from './orderOnlineSettings';

export type StorefrontHoursStrip = {
  status: KitchenAcceptanceStatus;
  open: boolean;
  untilHm: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function closeFromVenueLine(hoursJson: unknown): string | null {
  if (!hoursJson || typeof hoursJson !== 'object') return null;
  const line = formatVenueHoursLine(hoursJson as Record<string, unknown>);
  const match = line?.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return match ? match[2] : null;
}

export function storefrontHoursStrip(
  settings: KitchenSettings | null | undefined,
  when: Date = new Date(),
): StorefrontHoursStrip {
  if (!settings) {
    return { status: 'OPEN', open: true, untilHm: null };
  }
  const { status } = getKitchenStatus(settings, when);
  const open = status === 'OPEN' || status === 'CLOSING_SOON';
  const end = getSessionEndBaku(settings, when);
  let untilHm: string | null = null;
  if (end) {
    const parts = getBakuWallParts(end);
    untilHm = `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  }
  if (!untilHm) untilHm = closeFromVenueLine(settings.hours_json);
  return { status, open, untilHm };
}
