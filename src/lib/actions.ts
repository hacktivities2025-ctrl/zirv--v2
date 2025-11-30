'use server';

import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from './constants';

export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2025';

  if (password !== ADMIN_PASSWORD) {
    return { error: 'Yanlış parol.' };
  }
 cookies().set(AUTH_TOKEN_COOKIE, 'admin-logged-in', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, 
  });
  
  cookies().set('user_role', 'admin', {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });

  return { error: null };
}

export async function logout() {
  cookies().delete(AUTH_TOKEN_COOKIE);
  cookies().delete('user_role');
  cookies().delete('company_status');
}
