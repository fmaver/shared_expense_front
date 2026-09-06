import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPersonalGroup } from '@/api/personal';
import { Skeleton } from '@/components/ui/skeleton';
import GroupDueDatesPage from './GroupDueDatesPage';

/**
 * Vencimientos del grupo personal.
 *
 * Existe porque `/personal` es un árbol de rutas separado de `/groups/:groupId`: el dashboard
 * personal nunca maneja un groupId, así que la pantalla compartida no puede sacarlo de la URL.
 * Se resuelve acá y se le pasa explícito, en vez de duplicar la pantalla.
 */
export default function PersonalDueDatesPage() {
  const [groupId, setGroupId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPersonalGroup()
      .then((group) => {
        if (!cancelled) setGroupId(group.id);
      })
      .catch((error: Error) => toast.error(error.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (groupId === null) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return <GroupDueDatesPage groupId={groupId} />;
}
