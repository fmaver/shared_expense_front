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
      } catch {
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

export async function getGroupMembersAsMember(groupId: number): Promise<Member[]> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${config.apiBaseUrl}/api/v1/groups/${groupId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  if (!data || !data.data) {
    throw new Error('Invalid response format from API');
  }
  // GroupMemberResponse has memberId; remap to Member shape expected by existing components
  return (data.data as Array<{ memberId: number; name: string; email: string }>).map(m => ({
    id: m.memberId,
    name: m.name,
    telephone: '',
  }));
}