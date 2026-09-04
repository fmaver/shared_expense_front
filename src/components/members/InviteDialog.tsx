import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createInvitation } from '@/api/invitations';
import { addNamedMember } from '@/api/groups';
import { normalizeArPhone } from '@/utils/phone';
import type { InvitationChannel } from '@/types/expense';

/** 'name' adds a member with no contact details — nothing is sent to them. */
type MemberChannel = InvitationChannel | 'name';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  /** Called after a member is added or invited — the caller should refresh its lists. */
  onMemberAdded: () => void;
}

export function InviteDialog({ open, onOpenChange, groupId, onMemberAdded }: InviteDialogProps) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<MemberChannel>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const channelLabels: Record<MemberChannel, string> = {
    email: t('members.emailChannel'),
    phone: t('members.whatsappChannel'),
    name: t('members.nameOnlyChannel'),
  };

  const reset = () => {
    setName('');
    setContact('');
    setChannel('email');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const isNameOnly = channel === 'name';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!isNameOnly && !contact.trim()) return;
    setIsLoading(true);
    try {
      if (isNameOnly) {
        await addNamedMember(groupId, name.trim());
      } else {
        await createInvitation(groupId, {
          name: name.trim(),
          channel,
          contact: channel === 'phone' ? normalizeArPhone(contact) : contact.trim(),
        });
      }
      toast.success(isNameOnly ? t('members.memberAdded') : t('toasts.invitationSent'));
      reset();
      onMemberAdded();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => handleOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('members.inviteTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inviteName">{t('members.inviteFullName')}</Label>
            <Input
              id="inviteName"
              required
              autoFocus
              placeholder="e.g. María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inviteChannel">{t('members.channel')}</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as MemberChannel)}>
              <SelectTrigger id="inviteChannel" className="w-full">
                <span className="flex-1 text-left">{channelLabels[channel]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{t('members.emailChannel')}</SelectItem>
                <SelectItem value="phone">{t('members.whatsappChannel')}</SelectItem>
                <SelectItem value="name">{t('members.nameOnlyChannel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNameOnly ? (
            <p className="text-xs text-muted-foreground">{t('members.nameOnlyHelp')}</p>
          ) : (
          <div className="space-y-1.5">
            <Label htmlFor="inviteContact">
              {channel === 'email' ? t('members.emailAddress') : t('members.phoneNumber')}
            </Label>
            {channel === 'email' ? (
              <Input
                id="inviteContact"
                required
                type="email"
                placeholder="maria@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            ) : (
              <PhoneInput id="inviteContact" value={contact} onChange={setContact} />
            )}
            {channel === 'phone' && (
              <p className="text-xs text-muted-foreground">
                {t('members.phoneHelp')}
              </p>
            )}
          </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand/90 text-white"
              disabled={isLoading || !name.trim() || (!isNameOnly && !contact.trim())}
            >
              {isLoading
                ? t(isNameOnly ? 'members.adding' : 'members.sending')
                : t(isNameOnly ? 'members.addMember' : 'members.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
