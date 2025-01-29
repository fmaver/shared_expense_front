import { config } from '../config/env';
import type { Category, CategoryWithEmoji } from '../types/expense';

interface CategoryResponse {
  categories: string[];
}

interface CategoryWithEmojiResponse {
  name: string;
  emoji: string;
}

interface ApiResponse {
  data: CategoryResponse;
}

interface ApiResponseWithEmoji {
  data: CategoryWithEmojiResponse[];
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

export async function getCategoriesWithEmojis(): Promise<CategoryWithEmoji[]> {
  try {
    console.log('Making API request to categories with emojis endpoint...');
    const response = await fetch(`${config.apiBaseUrl}/api/v1/categories/with-emojis`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories with emojis');
    }
    const result: ApiResponseWithEmoji = await response.json();
    console.log('Raw API response:', result);
    // The API returns the data directly in the format we need
    return result.data.map(category => ({
      name: category.name,
      emoji: category.emoji
    }));
  } catch (error) {
    console.error('Error fetching categories with emojis:', error);
    return [];
  }
}
