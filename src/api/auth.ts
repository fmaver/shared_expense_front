import axios from 'axios';
import { config } from '../config/env';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export type NotificationType = 'WHATSAPP' | 'EMAIL' | 'NONE';

export interface MemberResponse {
  name: string;
  telephone: string;
  email: string;
  id: number;
  notificationPreference: NotificationType;
}

export interface MemberUpdate {
  name?: string;
  telephone?: string;
  email?: string;
  notification_preference?: NotificationType;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', data.username);
  formData.append('password', data.password);

  const response = await axios.post(`${config.apiBaseUrl}/api/v1/auth/token`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<MemberResponse> => {
  const response = await axios.get(`${config.apiBaseUrl}/api/v1/members/me`);
  return response.data.data;
};

export const updateProfile = async (data: MemberUpdate): Promise<MemberResponse> => {
  const response = await axios.patch(`${config.apiBaseUrl}/api/v1/members/me`, data);
  return response.data.data;
};

export const updatePassword = async (data: PasswordUpdate): Promise<MemberResponse> => {
  const response = await axios.post(`${config.apiBaseUrl}/api/v1/members/me/password`, data);
  return response.data.data;
};
