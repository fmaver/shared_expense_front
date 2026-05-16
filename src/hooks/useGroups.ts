import { useState, useEffect } from 'react';
import { getMyGroups, getGroup } from '../api/groups';
import type { Group } from '../types/expense';

export function useGroups() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Group[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getMyGroups();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  return { data, isLoading, error };
}

export function useGroup(groupId: number) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Group | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getGroup(groupId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
      } finally {
        setIsLoading(false);
      }
    };
    if (groupId) fetch();
  }, [groupId]);

  return { data, isLoading, error };
}
