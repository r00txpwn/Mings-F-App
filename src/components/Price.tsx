import { AZN_SYMBOL, formatMoney } from '../lib/money';

interface PriceProps {
  amount: number | string | null | undefined;
  className?: string;
  valueClassName?: string;
  symbolClassName?: string;
  symbolPosition?: 'prefix' | 'suffix';
}

export function Price({
  amount,
  className,
  valueClassName,
  symbolClassName,
  symbolPosition = 'suffix',
}: PriceProps) {
  const formatted = formatMoney(amount);

  return (
    <span className={className}>
      {symbolPosition === 'prefix' ? <span className={symbolClassName}>{AZN_SYMBOL}</span> : null}
      <span className={valueClassName}>{formatted}</span>
      {symbolPosition === 'suffix' ? (
        <>
          {' '}
          <span className={symbolClassName}>{AZN_SYMBOL}</span>
        </>
      ) : null}
    </span>
  );
}
