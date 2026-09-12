import { useState, useEffect } from 'react';
import { getMembers, getGroupMembersAsMember } from '../api/members';
import type { Member } from '../types/expense';

export function useMembers() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Member[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getMembers();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return { data, isLoading, error };
}

/**
 * Roster of one group.
 *
 * The roster is stored together with the group it was fetched for, and a roster fetched for
 * any other group is never handed out. Two things used to leak another group's members into
 * this one: a response for the group the user just left arriving after the current group's
 * (nothing cancelled the in-flight request), and a failed fetch leaving the previous group's
 * roster in place. Either one puts a stranger in the payer and split pickers of the expense
 * form — an outsider offered a share of a group they do not belong to.
 */
export function useGroupMembers(groupId: number) {
  const [result, setResult] = useState<{ groupId: number; members: Member[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError(null);

    getGroupMembersAsMember(groupId)
      .then(members => {
        if (active) setResult({ groupId, members });
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch group members');
        // An empty roster is wrong, but another group's roster is worse.
        setResult({ groupId, members: [] });
      });

    return () => {
      active = false;
    };
  }, [groupId]);

  // Anything belonging to a different group still counts as loading, which also covers the
  // render that happens after groupId changes but before the effect above runs.
  const fresh = result && result.groupId === groupId ? result.members : null;
  return { data: fresh ?? [], isLoading: fresh === null, error };
}
