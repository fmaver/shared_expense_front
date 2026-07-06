import { useState, useEffect } from 'react';
import { getPersonalGroup } from '@/api/personal';
import { getCurrentUser } from '@/api/auth';

/** Resolves the member's personal group id and their own member id. */
export function usePersonalContext() {
  const [personalGroupId, setPersonalGroupId] = useState<number | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);

  useEffect(() => {
    getPersonalGroup().then(g => setPersonalGroupId(g.id)).catch(() => {});
    getCurrentUser().then(u => setCurrentMemberId(u.id)).catch(() => {});
  }, []);

  return { personalGroupId, currentMemberId };
}
