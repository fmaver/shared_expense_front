import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarClock, PartyPopper } from 'lucide-react';
import { createGroup } from '@/api/groups';
import type { CreatableGroupType, Group } from '@/types/expense';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (group: Group) => void;
}

/**
 * Two steps: choose the kind of group, then name it.
 *
 * The type is asked first and separately because it is immutable — a group cannot be converted
 * later, so it is a real decision rather than a detail to bury next to the name field.
 */
export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const { t } = useTranslation();
  const [groupType, setGroupType] = useState<CreatableGroupType | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setGroupType(null);
    setName('');
    setError('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !groupType) return;
    setIsLoading(true);
    setError('');
    try {
      const group = await createGroup(name.trim(), groupType);
      reset();
      onCreated(group);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions: {
    value: CreatableGroupType;
    icon: React.ReactNode;
    name: string;
    description: string;
  }[] = [
    {
      value: 'regular',
      icon: <CalendarClock className="h-5 w-5 text-brand" />,
      name: t('groups.dialog.typeRegularName'),
      description: t('groups.dialog.typeRegularDesc'),
    },
    {
      value: 'one_time',
      icon: <PartyPopper className="h-5 w-5 text-brand" />,
      name: t('groups.dialog.typeOneTimeName'),
      description: t('groups.dialog.typeOneTimeDesc'),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {groupType === null ? t('groups.dialog.typeTitle') : t('groups.dialog.title')}
          </DialogTitle>
        </DialogHeader>

        {groupType === null ? (
          <div className="space-y-2">
            {typeOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGroupType(option.value)}
                className="w-full text-left rounded-xl border border-border bg-card px-4 py-3 hover:border-brand/40 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-semibold text-sm text-foreground">{option.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="groupName">{t('groups.dialog.nameLabel')}</Label>
              <Input
                id="groupName"
                required
                autoFocus
                placeholder={t('groups.dialog.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {groupType === 'one_time'
                  ? t('groups.dialog.typeOneTimeDesc')
                  : t('groups.dialog.typeRegularDesc')}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGroupType(null)}>
                {t('groups.dialog.typeBack')}
              </Button>
              <Button
                type="submit"
                className="bg-brand hover:bg-brand/90 text-white"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? t('groups.dialog.creating') : t('groups.dialog.create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
