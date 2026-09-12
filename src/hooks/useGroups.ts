import { useState, useEffect, useCallback } from 'react';
import { getMyGroups, getGroup } from '../api/groups';
import type { Group } from '../types/expense';

export function useGroups(archived = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Group[]>([]);

  const fetchGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setData(await getMyGroups(archived));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, [archived]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return { data, isLoading, error, refetch: fetchGroups };
}

/**
 * One group by id.
 *
 * Like the roster in `useGroupMembers`, the group is kept next to the id it was fetched for
 * and never served for a different one. A response for the group the user just left used to
 * be able to land last and leave the wrong name in the header — and, worse, the wrong
 * `groupType`, which decides whether the view settles a month or the whole group.
 */
export function useGroup(groupId: number) {
  const [result, setResult] = useState<{ groupId: number; group: Group | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return undefined;
    let active = true;
    setError(null);

    getGroup(groupId)
      .then(group => {
        if (active) setResult({ groupId, group });
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
        setResult({ groupId, group: null });
      });

    return () => {
      active = false;
    };
  }, [groupId]);

  const fresh = result && result.groupId === groupId ? result : null;
  return { data: fresh ? fresh.group : null, isLoading: fresh === null, error };
}
