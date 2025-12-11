// src/services/authService.ts
// Migrated from Back4App/Parse to Supabase
import { supabase } from '../lib/supabase';
import { User } from '../types';

// Export the localStorage key used across the app
export const CURRENT_USER_KEY = 'sentinelUser';

// Convert Supabase User → Your App's User type
const supabaseToAppUser = (supabaseUser: any): User => ({
  username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || 'User',
  email: supabaseUser.email || '',
  avatarUrl: supabaseUser.user_metadata?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email?.split('@')[0] || 'User')}&background=random`,
});

// SIGNUP with Email/Password
export const signup = async (email: string, username: string, password: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        },
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        throw new Error('Email already registered. Please sign in instead.');
      } else if (error.message.includes('invalid')) {
        throw new Error('Invalid email address format.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Signup failed. Please try again.');
    }

    const appUser = supabaseToAppUser(data.user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    return appUser;
  } catch (error: any) {
    throw new Error(error.message || 'Signup failed. Please try again.');
  }
};

// LOGIN with Email/Password
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please try again.');
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed. Please check your credentials and try again.');
    }

    const appUser = supabaseToAppUser(data.user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    return appUser;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed. Please check your credentials and try again.');
  }
};

// LOGIN with GitHub OAuth (optional - for future use)
export const loginWithGitHub = async (): Promise<void> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
};

// LOGOUT
export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Error during Supabase logout:', e);
  } finally {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// GET CURRENT USER (on app load)
export const getCurrentUser = (): User | null => {
  // First check localStorage
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved user:', e);
    }
  }

  // Then check Supabase session (async, but we return null for now and let the app refresh)
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      const appUser = supabaseToAppUser(data.session.user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    }
  });

  return null;
};

// Initialize auth state listener
export const initAuthListener = (onAuthChange: (user: User | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const appUser = supabaseToAppUser(session.user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
      onAuthChange(appUser);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      onAuthChange(null);
    }
  });

  return subscription;
};

// UPDATE USER (sync to localStorage)
export const updateUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};
