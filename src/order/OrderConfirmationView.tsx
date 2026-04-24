import { Check, ExternalLink } from 'lucide-react';

interface OrderConfirmationViewProps {
  displayNumber: string | number;
  trackUrl: string;
  labels: {
    title: string;
    subtitle: string;
    trackHint: string;
    openTracking: string;
  };
}

export function OrderConfirmationView({ displayNumber, trackUrl, labels }: OrderConfirmationViewProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="ming-anim-up w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ming-red shadow-ming-glow">
          <Check className="h-9 w-9 text-white" strokeWidth={3} />
        </div>

        <p className="ming-eyebrow mb-2">Ming&apos;s · Order placed</p>
        <h1 className="ming-display text-[34px] leading-[1.05] text-ming-bone sm:text-[40px]">
          {labels.title}
        </h1>
        <p className="mt-3 text-sm text-ming-ash">{labels.subtitle}</p>

        <div className="ming-card mt-8 p-6">
          <p className="ming-label mb-2">Order number</p>
          <p className="ming-display ming-mono text-[44px] leading-none text-ming-gold sm:text-[52px]">
            #{displayNumber}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => window.location.assign(trackUrl)}
            className="ming-btn-primary w-full py-4"
          >
            {labels.openTracking}
            <ExternalLink className="h-4 w-4" />
          </button>
          <p className="break-all text-[12px] text-ming-mute">{labels.trackHint}: {trackUrl}</p>
        </div>
      </div>
    </div>
  );
}
