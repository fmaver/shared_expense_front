import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getGroupMembers, leaveGroup } from '@/api/groups';
import { listInvitations, revokeInvitation } from '@/api/invitations';
import { InviteDialog } from '@/components/members/InviteDialog';
import { JoinLinkCard } from '@/components/members/JoinLinkCard';
import { UserPlus, LogOut, X } from 'lucide-react';
import type { GroupMember, Invitation } from '@/types/expense';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function GroupMembersPage() {
  const { t } = useTranslation();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const navigate = useNavigate();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const result = await getGroupMembers(groupId);
      setMembers(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, [groupId]);

  const loadInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const result = await listInvitations(groupId);
      setInvitations(result.filter((i) => i.status === 'pending'));
    } catch {
      // silently ignore — invitations are non-critical
    } finally {
      setInvitationsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, [loadMembers, loadInvitations]);

  const handleRevoke = async (inv: Invitation) => {
    const token = inv.shareUrl.split('/').pop()!;
    try {
      await revokeInvitation(groupId, token);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
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
      toast.error(err instanceof Error ? err.message : 'Failed to leave group');
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('members.title')}</h1>
        <Button
          size="sm"
          className="bg-brand hover:bg-brand/90 text-white"
          onClick={() => setShowInvite(true)}
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          {t('members.invite')}
        </Button>
      </div>

      {/* Member list */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {membersLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground">No members yet.</p>
        ) : (
          members.map((member) => (
            <div key={member.memberId} className="px-4 py-3 flex items-center gap-3">
              {/* Initials avatar */}
              <div className="h-9 w-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  {member.isStub && (
                    <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {t('members.pending')}
                    </span>
                  )}
                </div>
                {member.email && (
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                )}
                {!member.email && member.telephone && (
                  <p className="text-xs text-muted-foreground truncate">{member.telephone}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending invitations */}
      {(invitationsLoading || invitations.length > 0) && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground text-sm mb-3">{t('members.pendingInvitations')}</h3>
          {invitationsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {invitations.map((inv) => (
                <li key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.target}</p>
                    <p className="text-xs text-muted-foreground">
                      via {inv.channel} · expires {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => handleRevoke(inv)}
                    title="Revoke invitation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Join link card */}
      <JoinLinkCard groupId={groupId} />

      {/* Leave group — danger zone */}
      <div className="pt-4 border-t border-destructive/20">
        <p className="text-xs text-muted-foreground mb-2">{t('members.leaveGroupHint')}</p>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowLeaveConfirm(true)}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          {t('members.leaveGroup')}
        </Button>
      </div>

      {/* Invite dialog */}
      <InviteDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        groupId={groupId}
        onInvited={loadInvitations}
      />

      {/* Leave confirmation dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={(isOpen) => setShowLeaveConfirm(isOpen)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('members.leaveTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('members.leaveDesc')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? t('members.leaving') : t('members.leaveGroup')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
