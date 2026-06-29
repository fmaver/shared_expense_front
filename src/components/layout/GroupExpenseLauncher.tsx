import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useMembers';
import { getCurrentUser } from '@/api/auth';
import { useGroupExpenseCreate } from '@/hooks/useGroupExpenseCreate';
import { useIsland } from '@/contexts/IslandContext';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { TransferDialog } from '@/components/expenses/TransferDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export type LauncherMode = 'expense' | 'transfer';

interface GroupExpenseLauncherProps {
  open: boolean;
  onClose: () => void;
  mode: LauncherMode;
  /** When set, skip the group picker and go directly to the dialog */
  presetGroupId?: number;
}

/** Inner component — only rendered when we have a resolved groupId */
function GroupExpenseDialogs({
  groupId,
  mode,
  open,
  onClose,
}: {
  groupId: number;
  mode: LauncherMode;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const island = useIsland();
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);

  useEffect(() => {
    getCurrentUser()
      .then(u => setCurrentMemberId(u.id))
      .catch(() => {});
  }, []);

  const handleDone = useCallback(() => {
    island.success();
    onClose();
  }, [island, onClose]);

  const { create, duplicates, pendingExpense, confirm, cancel } = useGroupExpenseCreate({
    groupId,
    onDone: handleDone,
  });

  if (loadingMembers) {
    return (
      <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-3 py-4">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4 rounded-lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      {mode === 'expense' && (
        <AddExpenseDialog
          open={open}
          onOpenChange={v => { if (!v) onClose(); }}
          onSubmit={create}
          members={members}
          currentMemberId={currentMemberId}
          groupId={groupId}
        />
      )}

      {mode === 'transfer' && (
        <TransferDialog
          open={open}
          onOpenChange={v => { if (!v) onClose(); }}
          onSubmit={create}
          members={members}
          currentMemberId={currentMemberId}
        />
      )}

      {/* Duplicate-confirm dialog — mirrors ExpensesDashboard lines 276-299 */}
      <Dialog
        open={duplicates.length > 0}
        onOpenChange={isOpen => { if (!isOpen) cancel(); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('expenses.duplicateTitle')}</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>{t('expenses.duplicateDesc')}</p>
            {duplicates[0] && (
              <div className="mt-2 bg-muted rounded-lg p-3 text-foreground space-y-0.5">
                <p className="font-medium">{duplicates[0].description}</p>
                <p className="text-xs text-muted-foreground">
                  ${duplicates[0].amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ·{' '}
                  {duplicates[0].date}
                </p>
              </div>
            )}
            <p className="mt-2">{t('expenses.addAnywayQuestion')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancel}>
              {t('expenses.cancel')}
            </Button>
            <Button
              className="bg-brand hover:bg-brand/90 text-white"
              onClick={async () => {
                if (pendingExpense) await confirm();
              }}
            >
              {t('expenses.addAnyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GroupExpenseLauncher({
  open,
  onClose,
  mode,
  presetGroupId,
}: GroupExpenseLauncherProps) {
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    presetGroupId ?? null,
  );

  // When the launcher re-opens reset selection (unless preset)
  useEffect(() => {
    if (open) {
      setSelectedGroupId(presetGroupId ?? null);
    }
  }, [open, presetGroupId]);

  const resolvedGroupId = selectedGroupId ?? presetGroupId ?? null;
  const showPicker = open && resolvedGroupId === null;
  const showDialogs = open && resolvedGroupId !== null;

  return (
    <>
      {/* Group picker */}
      <Dialog open={showPicker} onOpenChange={v => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Elegir grupo</DialogTitle>
          </DialogHeader>

          {loadingGroups ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tenés grupos aún.</p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              {groups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-brand/40 hover:bg-accent/50 transition-colors text-left cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {group.members.length} miembro{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expense / Transfer dialogs with dup-check */}
      {showDialogs && resolvedGroupId !== null && (
        <GroupExpenseDialogs
          groupId={resolvedGroupId}
          mode={mode}
          open={showDialogs}
          onClose={onClose}
        />
      )}
    </>
  );
}
