'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';

/**
 * Login action
 */
export async function login(username: string, password: string) {
  try {
    console.log('Login action called for user:', username);
    
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });
    
    console.log(result);
    
    // Check if login was successful
    if (result?.error) {
      console.error('SignIn error:', result.error);
      return { success: false, error: 'Credenziali non valide' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Login action error:', error);
    
    if (error instanceof AuthError) {
      console.error('AuthError type:', error.type);
      console.error('AuthError message:', error.message);
      
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Credenziali non valide' };
        case 'CallbackRouteError':
          return { success: false, error: 'Errore di autenticazione' };
        default:
          return { success: false, error: 'Errore durante il login' };
      }
    }
    
    return { success: false, error: 'Errore durante il login' };
  }
}

/**
 * Logout action
 */
export async function logout() {
  await signOut({ redirect: false });
  return { success: true };
}
