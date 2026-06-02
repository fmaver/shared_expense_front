import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import type { Group } from '@/types/expense';

interface AppShellProps {
  onLogout: () => void;
}

export function AppShell({ onLogout }: AppShellProps) {
  const navigate = useNavigate();
  const [openNewGroup, setOpenNewGroup] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:flex-shrink-0 lg:w-56 overflow-hidden">
        <Sidebar onLogout={onLogout} onNewGroup={() => setOpenNewGroup(true)} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <TopBar onLogout={onLogout} onNewGroup={() => setOpenNewGroup(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CreateGroupDialog
        open={openNewGroup}
        onOpenChange={setOpenNewGroup}
        onCreated={(g: Group) => { navigate(`/groups/${g.id}`); }}
      />
    </div>
  );
}
