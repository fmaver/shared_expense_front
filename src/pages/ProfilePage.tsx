import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile, NotificationType } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * The backend stores Argentine numbers as 54XXXXXXXXXX (no leading 9 after country code).
 * We display them as +54 9 XX XXXX-XXXX so users can read and compare against their WhatsApp number.
 * On save we strip all non-digits to send back the raw number.
 */
function formatPhoneForDisplay(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('54') && digits.length >= 12) {
    const local = digits.slice(2);
    return `+54 9 ${local.slice(0, 2)} ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return raw;
}

function normalizePhoneForStorage(display: string): string {
  return display.replace(/\D/g, '');
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [notificationPreference, setNotificationPreference] = useState<NotificationType>('NONE');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await getCurrentUser();
        setName(userData.name);
        setEmail(userData.email);
        setTelephone(formatPhoneForDisplay(userData.telephone ?? ''));
        setNotificationPreference(userData.notificationPreference);
      } catch {
        toast.error('Failed to load user data');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [navigate]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notificationPreference === 'WHATSAPP' && !telephone) {
      toast.error('Phone number is required for WhatsApp notifications');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
        telephone: normalizePhoneForStorage(telephone),
        notification_preference: notificationPreference,
      });
      toast.success(t('toasts.profileUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center gap-3 py-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Avatar hero ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold shadow-md select-none">
          {getInitials(name)}
        </div>
        <h1 className="text-lg font-bold text-foreground mt-1">{name}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      {/* ── Profile form ─────────────────────────────────────────────── */}
      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {t('profile.fullName')}
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t('profile.email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="text-sm font-medium">
              {t('profile.phone')}
              {notificationPreference === 'WHATSAPP' && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <Input
              id="telephone"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">{t('profile.phoneHelp')}</p>
            {notificationPreference === 'WHATSAPP' && !telephone && (
              <p className="text-xs text-destructive">
                Phone number is required for WhatsApp notifications
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-preference" className="text-sm font-medium">
              {t('profile.notifPref')}
            </Label>
            <Select
              value={notificationPreference}
              onValueChange={(value) => setNotificationPreference(value as NotificationType)}
            >
              <SelectTrigger id="notification-preference" className="text-sm">
                <span className="flex-1 text-left">
                  {
                    { NONE: t('profile.notifNone'), EMAIL: t('profile.notifEmail'), WHATSAPP: t('profile.notifWhatsapp') }[notificationPreference]
                    ?? notificationPreference
                  }
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">{t('profile.notifNone')}</SelectItem>
                <SelectItem value="EMAIL">{t('profile.notifEmail')}</SelectItem>
                <SelectItem value="WHATSAPP">{t('profile.notifWhatsapp')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand hover:bg-brand/90 text-white w-full"
        >
          {isSaving ? t('profile.saving') : t('profile.saveProfile')}
        </Button>
      </form>
    </div>
  );
}
