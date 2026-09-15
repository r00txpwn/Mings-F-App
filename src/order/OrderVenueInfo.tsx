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
  compact?: boolean;
}

export function OrderVenueInfo({ hoursLine, address, phone, labels }: OrderVenueInfoProps) {
  if (!hoursLine && !address && !phone) return null;

  return (
    <aside className="rounded-lg border border-sf-line bg-sf-surface p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-sf-photo-label">
        {labels.infoTitle}
      </p>
      <ul className="space-y-2 text-[13px] text-sf-muted">
        {hoursLine ? (
          <li>
            <span className="font-semibold text-sf-ink">{labels.hours}: </span>
            {hoursLine}
          </li>
        ) : null}
        {address ? (
          <li>
            <span className="font-semibold text-sf-ink">{labels.address}: </span>
            {address}
          </li>
        ) : null}
        {phone ? (
          <li>
            <span className="font-semibold text-sf-ink">{labels.phone}: </span>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-sf-ink underline-offset-2 hover:underline">
              {phone}
            </a>
          </li>
        ) : null}
      </ul>
    </aside>
  );
}
