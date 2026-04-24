import { Check, ExternalLink } from 'lucide-react';

interface OrderConfirmationViewProps {
  displayNumber: string | number;
  trackUrl: string;
  snapshot: {
    lines: Array<{
      name: string;
      quantity: number;
      lineTotal: number;
      customizations: string[];
    }>;
    subtotal: number;
    total: number;
    fulfillment: 'takeaway' | 'delivery';
    etaText: string;
  } | null;
  labels: {
    title: string;
    subtitle: string;
    trackHint: string;
    openTracking: string;
    copyTracking: string;
    copiedTracking: string;
    orderNumber: string;
    summaryTitle: string;
    subtotal: string;
    total: string;
    fulfillment: string;
    eta: string;
    fulfillmentTakeaway: string;
    fulfillmentDelivery: string;
  };
}

export function OrderConfirmationView({ displayNumber, trackUrl, snapshot, labels }: OrderConfirmationViewProps) {
  const fulfillmentLabel =
    snapshot?.fulfillment === 'delivery' ? labels.fulfillmentDelivery : labels.fulfillmentTakeaway;

  const handleCopyTracking = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      window.alert(labels.copiedTracking);
    } catch {
      window.prompt(labels.copyTracking, trackUrl);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center px-5 py-10">
      <div className="ming-anim-up w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ming-red shadow-ming-glow">
          <Check className="h-9 w-9 text-white" strokeWidth={3} />
        </div>

        <p className="ming-eyebrow mb-2">Ming&apos;s · Order placed</p>
        <h1 className="ming-display text-[34px] leading-[1.05] text-ming-bone sm:text-[40px]">
          {labels.title}
        </h1>
        <p className="mt-3 text-sm text-ming-ash">{labels.subtitle}</p>

        <div className="ming-card mt-8 p-6">
          <p className="ming-label mb-2">{labels.orderNumber}</p>
          <p className="ming-display ming-mono text-[44px] leading-none text-ming-gold sm:text-[52px]">
            #{displayNumber}
          </p>
        </div>

        {snapshot ? (
          <div className="ming-card mt-4 p-5 text-left">
            <p className="ming-eyebrow mb-3">{labels.summaryTitle}</p>
            <ul className="space-y-2">
              {snapshot.lines.map((line, idx) => (
                <li key={`${line.name}-${idx}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-ming-bone">
                      {line.quantity}x {line.name}
                    </p>
                    <p className="ming-mono text-sm font-semibold text-ming-bone">{line.lineTotal.toFixed(2)} ₼</p>
                  </div>
                  {line.customizations.length > 0 ? (
                    <p className="mt-1.5 text-xs text-ming-ash">{line.customizations.join(' · ')}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ming-ash">{labels.subtotal}</dt>
                <dd className="ming-mono text-ming-bone">{snapshot.subtotal.toFixed(2)} ₼</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ming-ash">{labels.fulfillment}</dt>
                <dd className="text-ming-bone">{fulfillmentLabel}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ming-ash">{labels.eta}</dt>
                <dd className="text-ming-bone">{snapshot.etaText}</dd>
              </div>
              <div className="ming-divider my-1" />
              <div className="flex items-center justify-between">
                <dt className="ming-label">{labels.total}</dt>
                <dd className="ming-display text-lg text-ming-gold">
                  <span className="ming-mono">{snapshot.total.toFixed(2)}</span> ₼
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => window.location.assign(trackUrl)}
            className="ming-btn-primary w-full py-4"
          >
            {labels.openTracking}
            <ExternalLink className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleCopyTracking} className="ming-btn-ghost w-full py-3">
            {labels.copyTracking}
          </button>
          <p className="text-[12px] text-ming-mute">{labels.trackHint}</p>
        </div>
      </div>
    </div>
  );
}
