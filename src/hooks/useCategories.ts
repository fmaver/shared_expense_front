import { useState, useEffect } from 'react';
import { getCategoriesWithEmojis } from '../api/categories';
import type { CategoryWithEmoji } from '../types/expense';

export function useCategories() {
  const [data, setData] = useState<CategoryWithEmoji[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories with emojis...');
        const categories = await getCategoriesWithEmojis();
        console.log('Received categories:', categories);
        setData(categories);
      } catch (err) {
        console.error('Error in useCategories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { data, isLoading, error };
}
