import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { useTheme } from '@/hooks/useTheme';
import { Menu, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  onLogout: () => void;
  onNewGroup?: () => void;
}

export function TopBar({ onLogout, onNewGroup }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="lg:hidden h-12 bg-card dark:bg-sidebar border-b border-border flex items-center justify-between px-3 flex-shrink-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onLogout={onLogout} onNavigate={() => setOpen(false)} onNewGroup={() => { onNewGroup?.(); setOpen(false); }} />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-brand rounded-md flex items-center justify-center text-white font-black text-xs">✦</div>
        <span className="font-extrabold text-sm tracking-tight text-foreground">Jirens</span>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </header>
  );
}
