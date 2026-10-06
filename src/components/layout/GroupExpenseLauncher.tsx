import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroups, useGroup } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useMembers';
import { useCategories } from '@/hooks/useCategories';
import { usePersonalLedger } from '@/hooks/usePersonalLedger';
import { getCurrentUser } from '@/api/auth';
import { useGroupExpenseCreate } from '@/hooks/useGroupExpenseCreate';
import { useIsland } from '@/contexts/IslandContext';
import { useExpenseRefresh } from '@/contexts/ExpenseRefreshContext';
import { AddExpenseDialog } from '@/components/expenses/AddExpenseDialog';
import { PersonalExpenseSheet } from '@/components/personal/PersonalExpenseSheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export type LauncherMode = 'expense' | 'transfer';

interface GroupExpenseLauncherProps {
  open: boolean;
  onClose: () => void;
  mode: LauncherMode;
  /** When set, skip the group picker and go directly to the dialog */
  presetGroupId?: number;
  /** Foto de ticket elegida en el "+": la hoja abre leyéndola (V6.6). */
  scanFile?: File | null;
}

/** Inner component — only rendered when we have a resolved groupId */
function GroupExpenseDialogs({
  groupId,
  mode,
  open,
  onClose,
  scanFile,
}: {
  groupId: number;
  mode: LauncherMode;
  open: boolean;
  onClose: () => void;
  scanFile: File | null;
}) {
  const { t } = useTranslation();
  const island = useIsland();
  const { requestExpenseRefresh } = useExpenseRefresh();
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const { data: members = [], isLoading: loadingMembers } = useGroupMembers(groupId);
  // The launcher renders its own dialog, so it needs the group type as much as the dashboard.
  const { data: group } = useGroup(groupId);
  const isOneTimeGroup = group?.groupType === 'one_time';

  useEffect(() => {
    getCurrentUser()
      .then(u => setCurrentMemberId(u.id))
      .catch(() => {});
  }, []);

  const handleDone = useCallback(() => {
    island.success();
    // The launcher lives outside the group pages' subtree, so signal them to
    // refetch instead of relying on a local refetch they can't reach.
    requestExpenseRefresh();
    onClose();
  }, [island, requestExpenseRefresh, onClose]);

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
      {/* Un préstamo es la misma hoja abierta en su pestaña: una sola implementación. */}
      {(mode === 'expense' || mode === 'transfer') && (
        <AddExpenseDialog
          open={open}
          onOpenChange={v => { if (!v) onClose(); }}
          onSubmit={create}
          members={members}
          currentMemberId={currentMemberId}
          groupId={groupId}
          isOneTimeGroup={isOneTimeGroup}
          initialMode={mode === 'transfer' ? 'loan' : 'expense'}
          scanFile={mode === 'expense' ? scanFile : null}
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
              className="bg-brand hover:bg-brand/90 text-primary-foreground"
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

/** Qué se eligió en el picker: un grupo real, o lo personal (sin id, fuera de `useGroups`). */
type Selection = { kind: 'group'; groupId: number } | { kind: 'personal' };

function presetSelection(presetGroupId?: number): Selection | null {
  return presetGroupId != null ? { kind: 'group', groupId: presetGroupId } : null;
}

/** Inner component for the personal path — mirrors `GroupExpenseDialogs` but for your own money. */
function PersonalExpenseLauncherSheet({
  open,
  onClose,
  onBack,
  scanFile,
}: {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  scanFile: File | null;
}) {
  const island = useIsland();
  const { requestExpenseRefresh } = useExpenseRefresh();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const { data: ledger, refetch } = usePersonalLedger(year, month);
  const { data: categories } = useCategories();

  const handleSaved = useCallback(() => {
    island.success();
    requestExpenseRefresh();
    refetch();
  }, [island, requestExpenseRefresh, refetch]);

  return (
    <PersonalExpenseSheet
      open={open}
      onOpenChange={v => { if (!v) onClose(); }}
      initialKind="expense"
      year={year}
      month={month}
      categories={categories}
      existingRecurring={ledger?.recurringPersonalExpenses ?? []}
      onBack={onBack}
      onSaved={handleSaved}
      scanFile={scanFile}
    />
  );
}

export function GroupExpenseLauncher({
  open,
  onClose,
  mode,
  presetGroupId,
  scanFile = null,
}: GroupExpenseLauncherProps) {
  const { t } = useTranslation();
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const [selection, setSelection] = useState<Selection | null>(presetSelection(presetGroupId));

  // When the launcher re-opens reset selection (unless preset)
  useEffect(() => {
    if (open) {
      setSelection(presetSelection(presetGroupId));
    }
  }, [open, presetGroupId]);

  const showPicker = open && selection === null;
  const showGroupDialogs = open && selection?.kind === 'group';
  const showPersonalSheet = open && selection?.kind === 'personal';
  /*
    Una transferencia es entre miembros de un grupo: lo personal no tiene con quién, así que no
    se ofrece como destino cuando el "+" abrió en modo transferencia.
  */
  const offerPersonal = mode === 'expense';

  return (
    <>
      {/* Group picker */}
      <Dialog open={showPicker} onOpenChange={v => { if (!v) onClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('fab.chooseGroup')}</DialogTitle>
          </DialogHeader>

          {loadingGroups ? (
            <div className="space-y-2 py-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : groups.length === 0 && !offerPersonal ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('fab.noGroups')}</p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              {offerPersonal && (
                <button
                  type="button"
                  onClick={() => setSelection({ kind: 'personal' })}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-brand/40 hover:bg-accent/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                      <User className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t('fab.personal')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t('fab.personalDesc')}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              )}
              {groups.map(group => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelection({ kind: 'group', groupId: group.id })}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-brand/40 hover:bg-accent/50 transition-colors text-left cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-foreground text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('fab.members', { count: group.members.length })}
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
      {showGroupDialogs && selection?.kind === 'group' && (
        <GroupExpenseDialogs
          groupId={selection.groupId}
          mode={mode}
          open={showGroupDialogs}
          onClose={onClose}
          scanFile={scanFile}
        />
      )}

      {/* La hoja personal — misma que abre el "+" en /personal */}
      {showPersonalSheet && (
        <PersonalExpenseLauncherSheet
          open={showPersonalSheet}
          onClose={onClose}
          onBack={() => setSelection(null)}
          scanFile={scanFile}
        />
      )}
    </>
  );
}
