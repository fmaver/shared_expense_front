import { useCallback, useEffect, useState } from 'react';
import { useIsland } from '@/contexts/IslandContext';
import { useFabActions } from '@/contexts/FabActionsContext';
import { PersonalAddMatrix, type PersonalEntryKind } from './PersonalAddMatrix';
import { PersonalExpenseSheet } from './PersonalExpenseSheet';
import { PersonalIncomeSheet } from './PersonalIncomeSheet';
import { useScanPicker } from '@/components/expenses/ScanPicker';
import type { PersonalLedgerResponse, CategoryWithEmoji } from '@/types/expense';

interface PersonalAddLauncherProps {
  ledger: PersonalLedgerResponse | null;
  year: number;
  month: number;
  categories: CategoryWithEmoji[];
  refetch: () => void;
}

/**
 * El alta de tu plata: el panel de dos opciones y las dos hojas que salen de él.
 *
 * Vive acá y no en cada pantalla porque el "+" flotante está en otro árbol del DOM: el launcher
 * registra sus aperturas en el contexto del FAB y así la barra flotante y los botones de
 * escritorio abren exactamente lo mismo. Lo montan el home personal y las pantallas de sección.
 */
export function PersonalAddLauncher({ ledger, year, month, categories, refetch }: PersonalAddLauncherProps) {
  const island = useIsland();
  const { registerPersonalActions } = useFabActions();

  const [matrixOpen, setMatrixOpen] = useState(false);
  const [expenseKind, setExpenseKind] = useState<'expense' | 'fixed' | null>(null);
  /* La foto elegida en "Escanear ticket": la hoja del gasto abre leyéndola (V6.6). */
  const [scanFile, setScanFile] = useState<File | null>(null);
  const scanPicker = useScanPicker(file => {
    setMatrixOpen(false);
    setScanFile(file);
    setExpenseKind('expense');
  });
  const [incomeKind, setIncomeKind] = useState<'extra' | 'salary' | null>(null);

  const openMatrix = useCallback(() => {
    setExpenseKind(null);
    setScanFile(null);
    setIncomeKind(null);
    setMatrixOpen(true);
  }, []);

  const { pickAny, pickCamera } = scanPicker;
  const pick = useCallback((kind: PersonalEntryKind) => {
    // Escanear abre el selector desde este mismo toque: iOS no lo abre después.
    if (kind === 'scan') { pickAny(); return; }
    setMatrixOpen(false);
    setScanFile(null);
    if (kind === 'expense' || kind === 'fixed') setExpenseKind(kind);
    else setIncomeKind(kind);
  }, [pickAny]);

  useEffect(() => {
    registerPersonalActions({ openMatrix, pick, scanWithCamera: pickCamera });
    return () => registerPersonalActions(null);
  }, [registerPersonalActions, openMatrix, pick, pickCamera]);

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
      {scanPicker.inputs}
      <PersonalAddMatrix
        open={matrixOpen}
        onOpenChange={setMatrixOpen}
        onPick={pick}
      />

      {expenseKind && (
        <PersonalExpenseSheet
          open
          onOpenChange={open => { if (!open) { setExpenseKind(null); setScanFile(null); } }}
          initialKind={expenseKind}
          scanFile={scanFile}
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
