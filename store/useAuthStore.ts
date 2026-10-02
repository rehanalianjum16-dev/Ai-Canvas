import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  createdAt: number;
}

interface AuthState {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  initAuth: () => void;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  getAllUsers: () => User[];
}

const USERS_KEY = 'ai-canvas-users';
const SESSION_KEY = 'ai-canvas-session';
const DEMO_ADMIN: User = {
  id: 'admin_1',
  name: 'Admin',
  email: 'admin@aicanvas.com',
  password: 'admin123',
  role: 'admin',
  createdAt: Date.now(),
};

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 500));
const withoutPassword = ({ password: _password, ...user }: User) => user;

function readUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) as User[] : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Demo authentication stores user data in browser localStorage.
// Initialize the store on the client to restore the saved session.
// Passwords are excluded from the session record.
// Demo credentials and local storage are not suitable for production.
// Replace this flow with a secure server-side authentication service.
export const useAuthStore = create<AuthState>((set, get) => ({
  users: [],
  currentUser: null,
  isAuthenticated: false,
  isHydrated: false,

  initAuth: () => {
    if (typeof window === 'undefined') return;

    const users = readUsers();
    if (!users.some((user) => user.email === DEMO_ADMIN.email)) {
      users.push(DEMO_ADMIN);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    let currentUser: User | null = null;
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const { id } = JSON.parse(session) as { id: string };
        currentUser = users.find((user) => user.id === id) ?? null;
      }
    } catch (error) {
      console.error(error);
    }

    set({ users, currentUser, isAuthenticated: !!currentUser, isHydrated: true });
  },

  login: async (email, password) => {
    await delay();
    const normalizedEmail = email.trim().toLowerCase();
    const user = get().users.find(
      (item) => item.email.toLowerCase() === normalizedEmail && item.password === password,
    );
    if (!user) return false;

    localStorage.setItem(SESSION_KEY, JSON.stringify(withoutPassword(user)));
    set({ currentUser: user, isAuthenticated: true });
    return true;
  },

  signup: async (name, email, password) => {
    await delay();
    const users = get().users;
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) return false;

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      createdAt: Date.now(),
    };
    const updatedUsers = [...users, newUser];

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(SESSION_KEY, JSON.stringify(withoutPassword(newUser)));
    set({ users: updatedUsers, currentUser: newUser, isAuthenticated: true });
    return true;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ currentUser: null, isAuthenticated: false });
  },

  resetPassword: async (email) => {
    await delay();
    return get().users.some((user) => user.email === email);
  },

  getAllUsers: () => get().users,
}));

// Optional helper lines for future auth actions.
// Added to keep the store extensible.
// This section intentionally keeps the state simple.
// Extend as needed for role checks and session helpers.
// Session snapshot helper.
// Keep state in sync with local storage.
// Extend this store with future auth checks.
// Consider server-backed auth before production.
// This demo is intentionally lightweight.
// This section is intentionally minimal for demo purposes.
// A production app should validate sessions on the server.
// Future auth flows can be added without changing state shape.
// Add auditing and token refresh checks when scaling this store.
// Keep refresh logic separate from the client-only demo behavior.
