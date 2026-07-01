import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { updatePassword } from '@/api/auth';
import { toast } from 'sonner';

interface ConfigSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigSheet({ open, onOpenChange }: ConfigSheetProps) {
  const { displayMode, setDisplayMode } = useCurrency();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mínimo 6 caracteres');
      return;
    }
    setIsChangingPw(true);
    try {
      await updatePassword({ current_password: currentPassword, new_password: newPassword });
      toast.success('Contraseña actualizada');
      resetPasswordForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setIsChangingPw(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetPasswordForm();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>

        {/* ── Visualización ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Visualización
          </p>
          <div className="bg-muted/40 rounded-xl divide-y divide-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Moneda por defecto</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {displayMode === 'ars'
                    ? 'Todo en ARS (conversión automática)'
                    : 'En moneda original'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisplayMode(displayMode === 'ars' ? 'original' : 'ars')}
                className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 cursor-pointer ${
                  displayMode === 'ars' ? 'bg-brand' : 'bg-input'
                }`}
                aria-label="Cambiar modo de moneda"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    displayMode === 'ars' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Seguridad ─────────────────────────────────────────────── */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Seguridad
          </p>
          <div className="bg-muted/40 rounded-xl p-4">
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <p className="text-sm font-medium">Cambiar contraseña</p>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="pr-10 text-sm"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="pr-10 text-sm"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Confirmar nueva contraseña</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="text-sm"
                  autoComplete="new-password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPw}
                className="w-full bg-brand hover:bg-brand/90 text-white"
              >
                {isChangingPw ? 'Guardando…' : 'Actualizar contraseña'}
              </Button>
            </form>
          </div>
        </section>

        <Separator />

        {/* ── Zona de peligro ───────────────────────────────────────── */}
        <section className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
            Zona de peligro
          </p>
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Eliminar tu cuenta es permanente. Todos tus datos serán borrados y no se puede deshacer.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() =>
                toast.info('Para eliminar tu cuenta contactá a soporte.')
              }
            >
              Eliminar cuenta
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
