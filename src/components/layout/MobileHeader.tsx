import React from 'react';
import { cn } from '@/lib/utils';
import { JirensMark } from '@/components/brand/JirensMark';
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
      {/* Left: brand mark — flex-1 so it mirrors the right side width */}
      <div className="flex-1 flex items-center gap-2">
        <JirensMark className="text-foreground" size={24} />
        <span className="font-display text-[15px] leading-none text-foreground">Jirens</span>
      </div>

      {/* Center: Dynamic Island — truly centered because both sides are flex-1 */}
      <DynamicIsland state={state} groupName={groupName} />

      {/* Right: Avatar / Account menu — flex-1 + justify-end mirrors the left */}
      <div className="flex-1 flex justify-end">
        <AccountMenu onLogout={onLogout} />
      </div>
    </header>
  );
}
