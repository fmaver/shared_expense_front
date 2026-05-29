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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createInvitation } from '@/api/invitations';
import type { InvitationChannel } from '@/types/expense';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  onInvited: () => void;
}

export function InviteDialog({ open, onOpenChange, groupId, onInvited }: InviteDialogProps) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<InvitationChannel>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setName('');
    setContact('');
    setChannel('email');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;
    setIsLoading(true);
    try {
      await createInvitation(groupId, {
        name: name.trim(),
        channel,
        contact: contact.trim(),
      });
      toast.success(t('toasts.invitationSent'));
      reset();
      onInvited();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
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
            <Select value={channel} onValueChange={(v) => setChannel(v as InvitationChannel)}>
              <SelectTrigger id="inviteChannel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">{t('members.emailChannel')}</SelectItem>
                <SelectItem value="phone">{t('members.whatsappChannel')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inviteContact">
              {channel === 'email' ? t('members.emailAddress') : t('members.phoneNumber')}
            </Label>
            <Input
              id="inviteContact"
              required
              type={channel === 'email' ? 'email' : 'tel'}
              placeholder={
                channel === 'email' ? 'maria@example.com' : '541138718498'
              }
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            {channel === 'phone' && (
              <p className="text-xs text-muted-foreground">
                {t('members.phoneHelp')}
              </p>
            )}
          </div>

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
              disabled={isLoading || !name.trim() || !contact.trim()}
            >
              {isLoading ? t('members.sending') : t('members.sendInvite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
