import { Clock, MapPin, Phone, Search } from 'lucide-react';

interface OrderVenueSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hoursLine: string | null;
  address: string;
  phone: string;
  labels: {
    search: string;
    hours: string;
    address: string;
    phone: string;
    infoTitle: string;
  };
}

export function OrderVenueSidebar({
  searchQuery,
  onSearchChange,
  hoursLine,
  address,
  phone,
  labels,
}: OrderVenueSidebarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-4 shadow-inner">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={labels.search}
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          autoComplete="off"
        />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{labels.infoTitle}</p>
        <ul className="space-y-3 text-sm">
          {hoursLine ? (
            <li className="flex gap-3 text-slate-300">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/90" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{labels.hours}</p>
                <p>{hoursLine}</p>
              </div>
            </li>
          ) : null}
          {address ? (
            <li className="flex gap-3 text-slate-300">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cockpit-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{labels.address}</p>
                <p className="leading-snug">{address}</p>
              </div>
            </li>
          ) : null}
          {phone ? (
            <li className="flex gap-3 text-slate-300">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{labels.phone}</p>
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-cockpit-300 hover:underline">
                  {phone}
                </a>
              </div>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
