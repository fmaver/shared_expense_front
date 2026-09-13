import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  downloadGroupPdf, downloadMonthlyPdf, settleAll, settleMonthlyShare,
  unsettleAll, unsettleMonthlyShare,
} from '@/api/shares';
import { useIsland } from '@/contexts/IslandContext';

/**
 * Cerrar, reabrir y exportar un mes.
 *
 * Las tres decisiones que dependen del tipo de grupo viven acá y no repetidas en cada
 * pantalla: un grupo de evento se salda entero porque no tiene meses que cerrar de a uno, y
 * exporta entero por la misma razón. Lo consumen la lista de gastos y la pantalla de Gente.
 */
export function useSettlementActions({
  groupId, groupName, year, month, isOneTime, groupTypeKnown, refetch,
}: {
  groupId: number;
  groupName: string;
  year: number;
  month: number;
  isOneTime: boolean;
  /** Hasta que el tipo se conoce no se salda nada: saldar lo que no es no se deshace desde la UI. */
  groupTypeKnown: boolean;
  refetch: () => void;
}) {
  const { t } = useTranslation();
  const island = useIsland();

  const settle = useCallback(async () => {
    if (!groupTypeKnown) return;
    island.loading();
    try {
      const result = isOneTime
        ? await settleAll(groupId)
        : await settleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to settle');
      refetch();
      toast.success(t(isOneTime ? 'toasts.groupSettled' : 'toasts.monthSettled'));
      island.success();
    } catch {
      toast.error(t('toasts.failedSettle'));
      island.reset();
    }
  }, [groupId, year, month, isOneTime, groupTypeKnown, refetch, island, t]);

  const unsettle = useCallback(async () => {
    if (!groupTypeKnown) return;
    island.loading();
    try {
      const result = isOneTime
        ? await unsettleAll(groupId)
        : await unsettleMonthlyShare(groupId, year, month);
      if (!result) throw new Error('Failed to reopen');
      refetch();
      toast.success(t('toasts.monthReopened'));
      island.success();
    } catch {
      toast.error(t('toasts.failedReopen'));
      island.reset();
    }
  }, [groupId, year, month, isOneTime, groupTypeKnown, refetch, island, t]);

  const exportPdf = useCallback(async () => {
    try {
      if (isOneTime) await downloadGroupPdf(groupId, groupName || 'grupo');
      else await downloadMonthlyPdf(groupId, year, month);
    } catch {
      toast.error(t('toasts.failedExport'));
    }
  }, [groupId, groupName, year, month, isOneTime, t]);

  return { settle, unsettle, exportPdf };
}
