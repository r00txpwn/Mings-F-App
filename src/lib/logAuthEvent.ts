import { supabase } from './supabase';
import { isStaffBuild } from './buildTarget';

export type AuthEventType = 'login' | 'logout';
export type StaffSurface = 'cockpit' | 'pos' | 'kds' | 'kiosk' | 'order-manager' | 'staff';

function detectDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

/** Map current staff-bundle path to a stable surface label for audit logs. */
export function resolveStaffSurface(): StaffSurface {
  const path = (typeof window !== 'undefined' ? window.location.pathname : '').toLowerCase();
  if (path.includes('/pos')) return 'pos';
  if (path.includes('/kds')) return 'kds';
  if (path.includes('/kiosk')) return 'kiosk';
  if (path.includes('/order-manager') || path.includes('/order-management')) return 'order-manager';
  if (path.includes('/spec-ops') || path === '/' || path === '') return 'cockpit';
  return 'staff';
}

/** Best-effort staff auth telemetry — never blocks sign-in/out. */
export async function logStaffAuthEvent(eventType: AuthEventType, userId: string): Promise<void> {
  if (!isStaffBuild() || !userId) return;

  const { error } = await supabase.from('auth_events').insert({
    user_id: userId,
    event_type: eventType,
    surface: resolveStaffSurface(),
    device_type: detectDeviceType(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 512) : null,
  });

  if (error && import.meta.env.DEV) {
    console.warn('[auth] logStaffAuthEvent failed:', error.message);
  }
}
