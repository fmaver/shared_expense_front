import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { PersonalAddMatrix, type PersonalEntryKind } from './PersonalAddMatrix';
import { PersonalExpenseSheet } from './PersonalExpenseSheet';
import { PersonalIncomeSheet } from './PersonalIncomeSheet';
import type { PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface PersonalAddLauncherProps {
  ledger: PersonalLedgerResponse | null;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  refetch: () => void;
}

/**
 * El alta de tu plata: la matriz y las dos hojas que salen de ella.
 *
 * Vive acá y no en cada pantalla porque el "+" flotante está en otro árbol del DOM: el launcher
 * registra sus aperturas en el contexto del FAB y así la barra flotante y los botones de
 * escritorio abren exactamente lo mismo. Lo montan el home personal y las pantallas de sección.
 */
export function PersonalAddLauncher({ ledger, year, month, categories, refetch }: PersonalAddLauncherProps) {
  const { t } = useTranslation();
  const island = useIsland();
  const { registerPersonalActions } = useFabActions();

  const [matrixOpen, setMatrixOpen] = useState(false);
  const [expenseKind, setExpenseKind] = useState<'expense' | 'fixed' | null>(null);
  const [incomeKind, setIncomeKind] = useState<'extra' | 'salary' | null>(null);

  const months = t('months', { returnObjects: true }) as string[];
  const monthLabel = (months[month - 1] ?? '').toLocaleLowerCase();

  const openMatrix = useCallback(() => {
    setExpenseKind(null);
    setIncomeKind(null);
    setMatrixOpen(true);
  }, []);

  const pick = useCallback((kind: PersonalEntryKind) => {
    setMatrixOpen(false);
    if (kind === 'expense' || kind === 'fixed') setExpenseKind(kind);
    else setIncomeKind(kind);
  }, []);

  useEffect(() => {
    registerPersonalActions({ openMatrix, pick });
    return () => registerPersonalActions(null);
  }, [registerPersonalActions, openMatrix, pick]);

  const handleSaved = () => {
    refetch();
    island.success();
  };

  /* "Cambiar" cierra la hoja y devuelve a la matriz, sin perder de vista dónde estás. */
  const backToMatrix = () => {
    setExpenseKind(null);
    setIncomeKind(null);
    setMatrixOpen(true);
  };

  return (
    <>
      <PersonalAddMatrix
        open={matrixOpen}
        onOpenChange={setMatrixOpen}
        onPick={pick}
        monthLabel={monthLabel}
      />

      {expenseKind && (
        <PersonalExpenseSheet
          open
          onOpenChange={open => { if (!open) setExpenseKind(null); }}
          initialKind={expenseKind}
          year={year}
          month={month}
          categories={categories}
          existingRecurring={ledger?.recurringPersonalExpenses ?? []}
          onBack={backToMatrix}
          onSaved={handleSaved}
        />
      )}

      {incomeKind && (
        <PersonalIncomeSheet
          open
          onOpenChange={open => { if (!open) setIncomeKind(null); }}
          initialKind={incomeKind}
          year={year}
          month={month}
          existingIncomes={ledger?.incomes ?? []}
          currentBalance={ledger?.currentBalance ?? 0}
          onBack={backToMatrix}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
