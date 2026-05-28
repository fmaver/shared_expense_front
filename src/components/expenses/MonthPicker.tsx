import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

interface MonthPickerProps {
  year: number;
  month: number; // 1–12
  onNavigate: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onNavigate }: MonthPickerProps) {
  const prev = () => month === 1 ? onNavigate(year - 1, 12) : onNavigate(year, month - 1);
  const next = () => month === 12 ? onNavigate(year + 1, 1) : onNavigate(year, month + 1);

  return (
    <div className="flex items-center gap-2 justify-center">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground w-36 text-center tabular-nums">
        {MONTHS[month - 1]} {year}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
