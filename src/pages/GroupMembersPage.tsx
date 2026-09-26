import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LogOut, UserPlus, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getGroupMembers, leaveGroup } from '@/api/groups';
import { listInvitations, revokeInvitation } from '@/api/invitations';
import { InviteDialog } from '@/components/members/InviteDialog';
import { JoinLinkCard } from '@/components/members/JoinLinkCard';
import { BalancePanel } from '@/components/expenses/BalancePanel';
import { SettleSheet } from '@/components/expenses/SettleSheet';
import { MonthPager } from '@/components/expenses/MonthPager';
import { useGroup } from '@/hooks/useGroups';
import { useGroupMembers } from '@/hooks/useMembers';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { useMonthSearchParams } from '@/hooks/useMonthSearchParams';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { settleScope } from '@/utils/settleLog';
import { useSettlementState } from '@/contexts/SettlementContext';
import type { GroupMember, Invitation } from '@/types/expense';

function formatInviteDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/**
 * Gente: quiénes están en el grupo y cómo viene cada uno.
 *
 * Los saldos viven acá y no en la lista de gastos (§5): la lista responde "en qué se fue la
 * plata" y esta pantalla responde "quién le debe a quién", que son dos preguntas distintas.
 * Saldar se entra desde acá.
 */
export function GroupMembersPage() {
  const { t } = useTranslation();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const navigate = useNavigate();

  const { year, month, setYearMonth } = useMonthSearchParams();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const groupTypeKnown = !loadingGroup && group !== undefined;
  const isOneTime = group?.groupType === 'one_time';

  const { data: memberList = [] } = useGroupMembers(groupId);
  const { data: monthlyData, refetch: reloadMonth } = useMonthlyBalance(
    groupId, year, month, isOneTime, groupTypeKnown,
  );
  const currentMember = useCurrentMember();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // El sidebar de desktop muestra tu posición en el grupo; se la publica quien ya la tiene.
  const { setViewedMonthState } = useSettlementState();
  useEffect(() => {
    setViewedMonthState({
      isSettled: monthlyData?.isSettled ?? false,
      yourBalance: currentMember && monthlyData
        ? (monthlyData.balances[String(currentMember.id)] ?? 0)
        : null,
    });
    return () => setViewedMonthState({ isSettled: false, yourBalance: null });
  }, [monthlyData, currentMember, setViewedMonthState]);

  const expensesPath = `/groups/${groupId}?year=${year}&month=${month}`;
  const settleProgressPath = `/groups/${groupId}/settle?year=${year}&month=${month}`;

  /*
    Saldar se entra desde acá, pero no vive acá. El plan es una hoja, el progreso una pantalla
    y el cierre una tarjeta en Gastos: este botón sólo sabe a cuál de los tres te toca ir.
  */
  const openSettle = () => {
    if (monthlyData?.isSettled) { navigate(expensesPath); return; }
    const started = (monthlyData?.expenses ?? []).some(e => e.category === 'prestamo');
    if (started) navigate(settleProgressPath);
    else setShowSettle(true);
  };

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      setMembers(await getGroupMembers(groupId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  const loadInvitations = useCallback(async () => {
    try {
      const result = await listInvitations(groupId);
      setInvitations(result.filter(i => i.status === 'pending'));
    } catch {
      // Las invitaciones no son críticas para leer la pantalla.
    }
  }, [groupId]);

  const reload = useCallback(() => { loadMembers(); loadInvitations(); }, [loadMembers, loadInvitations]);
  useEffect(() => { reload(); }, [reload]);

  const stubMemberIds = useMemo(
    () => new Set(members.filter(m => m.isStub).map(m => m.memberId)),
    [members],
  );

  const handleRevoke = async (invitation: Invitation) => {
    const token = invitation.shareUrl.split('/').pop()!;
    try {
      await revokeInvitation(groupId, token);
      setInvitations(prev => prev.filter(i => i.id !== invitation.id));
      toast.success(t('toasts.invitationRevoked'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup(groupId);
      toast.success(t('toasts.leftGroup'));
      navigate('/');
    } catch (err) {
      // El backend rechaza mientras haya saldo abierto, y su mensaje lo explica.
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-5 py-4 lg:px-7 lg:py-6">
      {!isOneTime && (
        <MonthPager
          year={year}
          month={month}
          onNavigate={setYearMonth}
          isSettled={monthlyData?.isSettled}
        />
      )}

      {/* ── Cómo viene cada uno ─────────────────────────────────────────────────────── */}
      {monthlyData ? (
        <BalancePanel
          groupId={groupId}
          isOneTime={isOneTime}
          balances={monthlyData.balances}
          transfers={monthlyData.transfers ?? []}
          members={memberList}
          isSettled={monthlyData.isSettled}
          expenses={monthlyData.expenses}
          currentMemberId={currentMember?.id ?? null}
          stubMemberIds={stubMemberIds}
          scope={settleScope(groupId, isOneTime, year, month)}
          onOpenSettle={openSettle}
          onChanged={reloadMonth}
        />
      ) : (
        <Skeleton className="h-64 w-full rounded-card" />
      )}

      {/* ── Invitaciones pendientes ─────────────────────────────────────────────────── */}
      {invitations.length > 0 && (
        <div className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h2 className="mb-3 text-[13px] font-bold text-foreground">
            {t('members.pendingInvitations')}
          </h2>
          <div className="space-y-2">
            {invitations.map(invitation => (
              <div key={invitation.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-foreground">
                    {invitation.target}
                  </p>
                  <p className="text-[11.5px] font-medium text-muted-2">
                    {formatInviteDate(invitation.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(invitation)}
                  aria-label={t('common.delete')}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-2 hover:bg-surface-sunken hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {membersLoading && <Skeleton className="h-12 w-full rounded-card" />}

      {/* ── Sumar gente: una fila punteada, no una zona aparte ──────────────────────── */}
      <div className="flex items-center gap-2 rounded-card border border-dashed border-line-strong px-4 py-3">
        <UserPlus className="h-4 w-4 shrink-0 text-muted-2" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="min-w-0 flex-1 cursor-pointer text-left text-[12.5px] font-bold text-foreground hover:text-brand-ink"
        >
          {t('members.inviteRow')}
        </button>
        <button
          type="button"
          onClick={() => setShowLink(v => !v)}
          className="shrink-0 cursor-pointer text-[12px] font-bold text-brand-ink hover:underline"
        >
          {t('members.inviteLink')}
        </button>
      </div>

      {showLink && <JoinLinkCard groupId={groupId} />}

      {/* ── Salir del grupo ─────────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <p className="mb-2 text-[11.5px] font-medium text-muted-2">{t('members.leaveGroupHint')}</p>
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-line-strong px-3.5 py-2 text-[12px] font-bold text-muted-1 transition-colors hover:bg-surface-sunken"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t('members.leaveGroup')}
        </button>
      </div>

      <InviteDialog
        groupId={groupId}
        open={showInvite}
        onOpenChange={setShowInvite}
        onMemberAdded={reload}
      />

      {monthlyData && !monthlyData.isSettled && (
        <SettleSheet
          open={showSettle}
          onOpenChange={setShowSettle}
          groupName={group?.name ?? ''}
          month={month}
          isOneTime={isOneTime}
          members={memberList}
          transfers={monthlyData.transfers ?? []}
          expenses={monthlyData.expenses}
          currentMemberId={currentMember?.id ?? null}
          scope={settleScope(groupId, isOneTime, year, month)}
          onMarkOneByOne={() => { setShowSettle(false); navigate(settleProgressPath); }}
        />
      )}

      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('members.leaveTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-1">{t('members.leaveDesc')}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? t('members.leaving') : t('members.leaveGroup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
