import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IslandState } from '@/contexts/IslandContext';

interface DynamicIslandProps {
  state: IslandState | 'group';
  groupName?: string;
}

export function DynamicIsland({ state, groupName }: DynamicIslandProps) {
  const isExpanded = state === 'success' || state === 'group';

  return (
    <div
      className={cn(
        'bg-foreground text-background rounded-full px-4 py-1.5',
        'backdrop-blur-md shadow-sm',
        'flex items-center justify-center gap-1.5',
        'h-8 transition-all duration-300 ease-out overflow-hidden',
        isExpanded ? 'min-w-[160px]' : 'min-w-[120px]',
      )}
    >
      {state === 'idle' && (
        <>
          <span className="font-black text-xs leading-none">✦</span>
          <span className="font-extrabold text-xs tracking-tight">Jirens</span>
        </>
      )}

      {state === 'loading' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="font-semibold text-xs tracking-tight">Jirens</span>
        </>
      )}

      {state === 'success' && (
        <>
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold text-xs tracking-tight">Guardado</span>
        </>
      )}

      {state === 'group' && groupName && (
        <>
          <span className="font-black text-xs leading-none">✦</span>
          <span className="font-semibold text-xs tracking-tight truncate max-w-[120px]">
            {groupName}
          </span>
        </>
      )}
    </div>
  );
}
