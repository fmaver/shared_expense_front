import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  /** The local part of the number (without the +54 country code), as typed. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

/**
 * Phone input with a fixed Argentine `+54` prefix and a local-number field.
 * The value is the local part only; normalize with `normalizeArPhone` on submit.
 */
export function PhoneInput({ value, onChange, id, placeholder = '11 3456 7890' }: PhoneInputProps) {
  return (
    <div className="flex items-stretch gap-2">
      <span className="inline-flex items-center gap-1 px-3 rounded-md border border-input bg-muted text-sm text-foreground select-none shrink-0">
        🇦🇷 +54
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1"
      />
    </div>
  );
}
