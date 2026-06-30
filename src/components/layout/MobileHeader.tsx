import React from 'react';
import { DynamicIsland } from './DynamicIsland';
import { AccountMenu } from './AccountMenu';
import type { IslandState } from '@/contexts/IslandContext';

interface MobileHeaderProps {
  onLogout: () => void;
  state: IslandState | 'group';
  groupName?: string;
}

export function MobileHeader({ onLogout, state, groupName }: MobileHeaderProps) {
  return (
    <header className="lg:hidden h-12 bg-card dark:bg-sidebar border-b border-border flex items-center justify-between px-3 flex-shrink-0">
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
