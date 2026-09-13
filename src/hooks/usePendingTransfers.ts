import { useCallback, useEffect, useState } from 'react';
import { getMonthlyBalance } from '@/api/shares';
import { getGroupMembersAsMember } from '@/api/members';
import type { DebtTransfer, GroupBalanceItem, Member } from '@/types/expense';

export interface PendingGroupTransfers {
  groupId: number;
  groupName: string;
  members: Member[];
  /** Sólo los movimientos en los que estás vos: el resto no es asunto de tu pantalla. */
  transfers: DebtTransfer[];
}

/**
 * Los pagos mínimos pendientes que te involucran, por grupo.
 *
 * El ledger personal trae el saldo neto de cada grupo, pero no quién le paga a quién: eso lo
 * calcula el backend por grupo y por mes. Así que se pide el mes de cada grupo con saldo
 * abierto — de a uno, no en ráfaga — y se filtran los transfers donde aparecés.
 *
 * No hay endpoint nuevo: es el mismo `/shares/{año}/{mes}` que ya usa la pantalla del grupo.
 */
export function usePendingTransfers(
  year: number,
  month: number,
  groupBalances: GroupBalanceItem[] | undefined,
  currentMemberId: number | null,
) {
  const [groups, setGroups] = useState<PendingGroupTransfers[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  // La lista de ids con saldo abierto, como string, para no re-disparar el efecto cuando el
  // ledger se reconstruye con los mismos datos.
  const openGroupKey = (groupBalances ?? [])
    .filter(g => !g.isSettled && Math.abs(g.netBalance) > 0.01)
    .map(g => g.sourceGroupId)
    .join(',');

  useEffect(() => {
    if (!openGroupKey || currentMemberId == null) {
      setGroups([]);
      return;
    }
    let cancelled = false;

    (async () => {
      const ids = openGroupKey.split(',').map(Number);
      const result: PendingGroupTransfers[] = [];
      for (const groupId of ids) {
        const balance = await getMonthlyBalance(groupId, year, month);
        if (!balance) continue;
        const mine = (balance.transfers ?? []).filter(
          tr => tr.fromMemberId === currentMemberId || tr.toMemberId === currentMemberId,
        );
        if (mine.length === 0) continue;
        const members = await getGroupMembersAsMember(groupId).catch(() => [] as Member[]);
        const name = (groupBalances ?? []).find(g => g.sourceGroupId === groupId)?.sourceGroupName ?? '';
        result.push({ groupId, groupName: name, members, transfers: mine });
      }
      if (!cancelled) setGroups(result);
    })().catch(() => { if (!cancelled) setGroups([]); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGroupKey, year, month, currentMemberId, reloadKey]);

  return { groups, reload };
}
