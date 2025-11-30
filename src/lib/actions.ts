'use server';

import { cookies } from 'next/headers';
import { AUTH_TOKEN_COOKIE } from './constants';

// This function is for the admin login
export async function login(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  
  // In a real app, you'd use a more secure way to store and check the admin password.
  // For this prototype, we're hardcoding it.
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2025';

  if (password !== ADMIN_PASSWORD) {
    return { error: 'Yanlış parol.' };
  }

  // If the password is correct, set a secure cookie.
  cookies().set(AUTH_TOKEN_COOKIE, 'admin-logged-in', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
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
