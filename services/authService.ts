// src/services/authService.ts
import Parse from '../lib/parse';
import { User } from '../types';

// Export the localStorage key used across the app
export const CURRENT_USER_KEY = 'sentinelUser';

// Convert Parse.User → Your App's User type
const parseToAppUser = (parseUser: Parse.User): User => ({
  username: parseUser.get('username') || '',
  email: parseUser.get('email') || '',
  avatarUrl: parseUser.get('avatarUrl') || `https://ui-avatars.com/api/?name=${encodeURIComponent(parseUser.get('username') || 'User')}&background=random`,
});

// SIGNUP
export const signup = async (email: string, username: string, password: string): Promise<User> => {
  const user = new Parse.User();
  user.set('username', username);
  user.set('email', email);
  user.set('password', password);

  try {
    const newUser = await user.signUp();
    const appUser = parseToAppUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    return appUser;
  } catch (error: any) {
    throw new Error(error.message || 'Signup failed');
  }
};

// LOGIN
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const user = await Parse.User.logIn(email, password);
    const appUser = parseToAppUser(user);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
    return appUser;
  } catch (error: any) {
    throw new Error(error.message || 'Invalid email or password');
  }
};

// LOGOUT
export const logout = async (): Promise<void> => {
  try {
    await Parse.User.logOut();
  } finally {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// GET CURRENT USER (on app load)
export const getCurrentUser = (): User | null => {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved user:', e);
      return null;
    }
  }

  try {
    const parseUser = Parse.User.current();
    if (parseUser) {
      const appUser = parseToAppUser(parseUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(appUser));
      return appUser;
    }
  } catch (e) {
    console.warn('Parse SDK not initialized or error getting current user:', e);
  }
  return null;
};

// UPDATE USER (sync to localStorage)
export const updateUser = (user: User): void => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};