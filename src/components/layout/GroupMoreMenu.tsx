import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LogOut, MoreHorizontal, Share2, UserPlus } from 'lucide-react';
import { CapsuleSlot } from '@/components/ui/Glass';
import { InviteDialog } from '@/components/members/InviteDialog';
import { getJoinLink } from '@/api/joinLinks';

/**
 * El "⋯" del grupo (V6.2): invitar, compartir el link y salir. Ajustes ya es una pestaña,
 * así que no se repite acá; "silenciar avisos" no está porque el backend no puede silenciar
 * un grupo solo (la preferencia de avisos es por persona, para toda la app).
 *
 * Salir lleva a Ajustes en vez de salir desde acá: ahí vive la regla de que sólo se puede
 * con los saldos en cero, y la explicación de por qué no se puede cuando no se puede.
 */
export function GroupMoreMenu({ groupId, groupName }: { groupId: number; groupName: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const shareLink = async () => {
    setOpen(false);
    try {
      const link = await getJoinLink(groupId);
      const text = t('groupMenu.shareText', { group: groupName });
      if (navigator.share) {
        await navigator.share({ title: groupName, text, url: link.url });
      } else {
        await navigator.clipboard.writeText(link.url);
        toast.success(t('toasts.linkCopied'));
      }
    } catch (err) {
      // Cerrar la hoja de compartir no es un error.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error(err instanceof Error ? err.message : t('groupMenu.shareFailed'));
    }
  };

  const item = 'flex w-full cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-sunken/70';

  return (
    <div ref={rootRef} className="relative">
      <CapsuleSlot aria-label={t('groupMenu.more')} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2.4} />
      </CapsuleSlot>

      {open && (
        <div className="glass absolute right-0 top-11 z-50 w-56 rounded-[18px] p-1.5" role="menu">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); setInviteOpen(true); }}>
            <UserPlus className="h-4 w-4 text-brand-ink" aria-hidden="true" />
            {t('groupMenu.invite')}
          </button>
          <button type="button" role="menuitem" className={item} onClick={shareLink}>
            <Share2 className="h-4 w-4 text-brand-ink" aria-hidden="true" />
            {t('groupMenu.shareLink')}
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => { setOpen(false); navigate(`/groups/${groupId}/settings`); }}
          >
            <LogOut className="h-4 w-4 text-muted-1" aria-hidden="true" />
            {t('groupMenu.leave')}
          </button>
        </div>
      )}

      {/* Después de sumar a alguien, Gente es donde se lo ve. */}
      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        groupId={groupId}
        onMemberAdded={() => navigate(`/groups/${groupId}/members`)}
      />
    </div>
  );
}
