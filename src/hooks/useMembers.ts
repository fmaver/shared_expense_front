import { useState, useEffect } from 'react';
import { getMembers } from '../api/members';
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