import { User } from '../types';
import { generateAvatar } from '../utils/avatar';

export const CURRENT_USER_KEY = 'sentinel-user';
const USERS_DB_KEY = 'sentinel-users-db';

// Helper to get all users from the mock DB
const getAllUsers = (): User[] => {
    const usersJson = localStorage.getItem(USERS_DB_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save all users to the mock DB
const saveAllUsers = (users: User[]): void => {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem(CURRENT_USER_KEY);
            return null;
        }
    }
    return null;
};

export const login = (email: string, password: string): User => {
    const users = getAllUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        throw new Error('No user found with that email address.');
    }

    if (user.password !== password) {
        throw new Error('Invalid password.');
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
};

export const signup = (email: string, username: string, password: string): User => {
    const users = getAllUsers();
    if (users.some(u => u.email === email)) {
        throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
        email,
        username,
        password, // Storing plain text for mock purposes. In a real app, this would be hashed.
        avatarUrl: generateAvatar(email),
    };

    const updatedUsers = [...users, newUser];
    saveAllUsers(updatedUsers);

    // Automatically log in the new user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
};


export const logout = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const updateUser = (updatedUser: User): void => {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.email === updatedUser.email);

    if (userIndex !== -1) {
        // Update the user in the main database list
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        saveAllUsers(users);
    }
    
    // Also update the currently logged-in user's session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
}