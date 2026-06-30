import React from 'react';
import { cn } from '@/lib/utils';
import { DynamicIsland } from './DynamicIsland';
import { AccountMenu } from './AccountMenu';
import { useScroll } from '@/contexts/ScrollContext';
import type { IslandState } from '@/contexts/IslandContext';

interface MobileHeaderProps {
  onLogout: () => void;
  state: IslandState | 'group';
  groupName?: string;
}

export function MobileHeader({ onLogout, state, groupName }: MobileHeaderProps) {
  const { isAtTop } = useScroll();

  return (
    <header
      className={cn(
        // Mobile: fixed overlay; Desktop: hidden
        'lg:hidden fixed top-0 inset-x-0 z-30',
        'h-12 flex items-center justify-between px-3',
        'transition-colors duration-500 ease-out',
        isAtTop
          ? 'bg-background/95 backdrop-blur-sm border-b border-border/50'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      {/* Left: brand mark */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center text-white font-black text-xs">
          ✦
        </div>
        <span className="font-extrabold text-sm tracking-tight text-foreground">Jirens</span>
      </div>

      {/* Center: Dynamic Island */}
      <DynamicIsland state={state} groupName={groupName} />

      {/* Right: Avatar / Account menu */}
      <AccountMenu onLogout={onLogout} />
    </header>
  );
}
