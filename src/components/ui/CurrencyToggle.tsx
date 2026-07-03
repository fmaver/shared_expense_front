import { cn } from '@/lib/utils';

interface CurrencyToggleProps {
  value: 'ARS' | 'USD';
  onChange: (v: 'ARS' | 'USD') => void;
  className?: string;
}

export function CurrencyToggle({ value, onChange, className }: CurrencyToggleProps) {
  return (
    <div className={cn('inline-flex rounded-full bg-muted p-0.5 flex-shrink-0', className)}>
      {(['ARS', 'USD'] as const).map(currency => (
        <button
          key={currency}
          type="button"
          onClick={() => onChange(currency)}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer',
            value === currency
              ? 'bg-card shadow-sm text-brand'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
