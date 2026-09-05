import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroup } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateGroupName, leaveGroup, archiveGroup } from '@/api/groups';
import { toast } from 'sonner';
import { Archive, LogOut } from 'lucide-react';

export function GroupSettingsPage() {
  const { t } = useTranslation();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam!, 10);
  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(groupId);

  const [name, setName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsRenaming(true);
    try {
      await updateGroupName(groupId, name.trim());
      toast.success(t('toasts.groupRenamed'));
      setName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rename group');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveGroup(groupId);
      toast.success(t('groups.archivedToast'));
      navigate('/groups');
    } catch (err) {
      // The backend rejects this while the member still owes or is owed, and its message
      // says so — surface it rather than a generic failure.
      toast.error(err instanceof Error ? err.message : t('groups.archiveBlocked'));
      setIsArchiving(false);
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

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('settings.subtitle', { name: group?.name ?? '' })}
        </p>
      </div>

      {/* Rename section */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground text-sm mb-4">{t('settings.renameGroup')}</h2>
        <form onSubmit={handleRename} className="space-y-3">
          <div>
            <Label htmlFor="group-name" className="text-xs font-medium text-muted-foreground mb-1 block">
              {t('settings.groupName')}: <span className="font-semibold text-foreground">{group?.name}</span>
            </Label>
            <Input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New group name"
              className="text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={isRenaming || !name.trim()}
            className="bg-brand hover:bg-brand/90 text-white w-full"
          >
            {isRenaming ? t('settings.saving') : t('settings.save')}
          </Button>
        </form>
      </div>

      {/* Archive — reversible, so it sits above the danger zone rather than inside it. */}
      <div className="pt-2">
        <div className="border-t border-border pt-6">
          <h2 className="font-semibold text-foreground text-sm mb-1">{t('groups.archive')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('groups.archiveHint')}</p>
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            disabled={isArchiving}
            onClick={handleArchive}
          >
            <Archive className="h-4 w-4 mr-1.5" />
            {t('groups.archive')}
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-2">
        <div className="border-t border-destructive/20 pt-6">
          <h2 className="font-semibold text-foreground text-sm mb-3 text-destructive">
            {t('settings.dangerZone')}
          </h2>
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
      </div>

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
