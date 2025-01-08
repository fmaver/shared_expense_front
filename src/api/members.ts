import { config } from '../config/env';
import type { Member } from '../types/expense';

export async function getMembers(): Promise<Member[]> {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/v1/members/`, {
      redirect: 'follow', // explicitly follow redirects
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.redirected) {
      console.log('Request was redirected to:', response.url);
    }
    
    if (!response.ok) {
      console.error('Failed to fetch members:', {
        status: response.status,
        statusText: response.statusText,
        redirected: response.redirected,
        url: response.url,
        type: response.type
      });
      
      // Try to read response body even if it's an error
      try {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
      } catch (e) {
        console.error('Could not read error response body');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from API');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
}