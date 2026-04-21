import { Clock, MapPin, Phone } from 'lucide-react';

interface OrderVenueInfoProps {
  hoursLine: string | null;
  address: string;
  phone: string;
  labels: {
    hours: string;
    address: string;
    phone: string;
    infoTitle: string;
  };
  /** Compact mode for sidebars; default is a richer card. */
  compact?: boolean;
}

/**
 * Small "About this venue" card used in the menu view.
 * Replaces the old OrderVenueSidebar which was too large.
 */
export function OrderVenueInfo({ hoursLine, address, phone, labels, compact = false }: OrderVenueInfoProps) {
  if (!hoursLine && !address && !phone) return null;

  const rows = (
    <ul className="space-y-3 text-sm">
      {hoursLine ? (
        <li className="flex gap-3 text-ming-ash">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ming-gold" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ming-mute">{labels.hours}</p>
            <p className="text-ming-bone">{hoursLine}</p>
          </div>
        </li>
      ) : null}
      {address ? (
        <li className="flex gap-3 text-ming-ash">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ming-red" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ming-mute">{labels.address}</p>
            <p className="leading-snug text-ming-bone">{address}</p>
          </div>
        </li>
      ) : null}
      {phone ? (
        <li className="flex gap-3 text-ming-ash">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ming-flame" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ming-mute">{labels.phone}</p>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-ming-bone hover:text-ming-gold">
              {phone}
            </a>
          </div>
        </li>
      ) : null}
    </ul>
  );

  if (compact) {
    return (
      <aside className="ming-card p-4">
        <p className="ming-eyebrow mb-3">{labels.infoTitle}</p>
        {rows}
      </aside>
    );
  }

  return (
    <aside className="ming-card relative overflow-hidden p-5">
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-ming-red/10 blur-2xl" />
      <p className="ming-eyebrow mb-3">{labels.infoTitle}</p>
      {rows}
    </aside>
  );
}
