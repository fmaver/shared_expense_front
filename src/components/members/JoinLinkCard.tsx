import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getJoinLink, rotateJoinLink } from '@/api/joinLinks';
import { Copy, Check, RefreshCw, Link } from 'lucide-react';
import type { GroupJoinLink } from '@/types/expense';

interface JoinLinkCardProps {
  groupId: number;
}

export function JoinLinkCard({ groupId }: JoinLinkCardProps) {
  const { t } = useTranslation();
  const [joinLink, setJoinLink] = useState<GroupJoinLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  const handleGetLink = async () => {
    setIsLoading(true);
    try {
      const link = await getJoinLink(groupId);
      setJoinLink(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to get join link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink.url).then(() => {
      setCopied(true);
      toast.success(t('toasts.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRotate = async () => {
    setShowRotateConfirm(false);
    setIsLoading(true);
    try {
      const link = await rotateJoinLink(groupId);
      setJoinLink(link);
      toast.success(t('toasts.linkRotated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rotate join link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Link className="h-4 w-4 text-brand" />
        <h3 className="font-semibold text-foreground text-sm">{t('members.joinLinkTitle')}</h3>
      </div>

      {!joinLink ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Create a shareable link that lets anyone join this group.
          </p>
          <Button
            size="sm"
            className="bg-brand hover:bg-brand/90 text-white"
            onClick={handleGetLink}
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('members.createLink')}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-muted text-muted-foreground text-xs rounded-lg px-3 py-2 truncate font-mono select-all">
              {joinLink.url}
            </code>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={handleCopy}
              title="Copy link"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Unite al grupo: ${joinLink.url}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#25D366] hover:bg-[#1ebe59] text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Share on WhatsApp
            </a>
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => setShowRotateConfirm(true)}
              disabled={isLoading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t('members.rotate')}
            </Button>
          </div>
        </div>
      )}

      {/* Rotate confirmation dialog */}
      <Dialog open={showRotateConfirm} onOpenChange={(isOpen) => setShowRotateConfirm(isOpen)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rotate join link?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The current link will stop working immediately. Anyone who tries to use
            it will get an error. A new link will be generated.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRotateConfirm(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleRotate}
            >
              {t('members.rotate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
