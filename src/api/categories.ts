import { config } from '../config/env';
import type { Category } from '../types/expense';

interface CategoryResponse {
  categories: string[];
}

interface ApiResponse {
  data: CategoryResponse;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/categories/`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const result: ApiResponse = await response.json();
    return result.data.categories.map(name => ({ name }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}
