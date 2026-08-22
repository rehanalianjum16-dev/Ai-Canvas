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

const DEMO_ADMIN: User = {
  id: 'admin_1',
  name: 'Admin',
  email: 'admin@aicanvas.com',
  password: 'admin123',
  role: 'admin',
  createdAt: Date.now()
};

export const useAuthStore = create<AuthState>((set, get) => ({
  users: [],
  currentUser: null,
  isAuthenticated: false,
  isHydrated: false,

  initAuth: () => {
    if (typeof window === 'undefined') return;
    
    let storedUsers: User[] = [];
    try {
      const db = localStorage.getItem('ai-canvas-users');
      if (db) {
        storedUsers = JSON.parse(db);
      }
    } catch (e) {
      console.error(e);
    }

    if (!storedUsers.find(u => u.email === DEMO_ADMIN.email)) {
      storedUsers.push(DEMO_ADMIN);
      localStorage.setItem('ai-canvas-users', JSON.stringify(storedUsers));
    }

    let currentUser = null;
    try {
      const session = localStorage.getItem('ai-canvas-session');
      if (session) {
        const storedSession = JSON.parse(session);
        currentUser = storedUsers.find(u => u.id === storedSession.id) || null;
      }
    } catch(e) {}

    set({ 
      users: storedUsers, 
      currentUser, 
      isAuthenticated: !!currentUser,
      isHydrated: true 
    });
  },

  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { users } = get();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          // don't store password in session
          const { password: _, ...sessionUser } = user;
          localStorage.setItem('ai-canvas-session', JSON.stringify(sessionUser));
          set({ currentUser: user, isAuthenticated: true });
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500); // Simulate network delay
    });
  },

  signup: async (name, email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { users } = get();
        if (users.find(u => u.email === email)) {
          resolve(false); // Email already exists
          return;
        }

        const newUser: User = {
          id: Date.now().toString(),
          name,
          email,
          password,
          role: 'user',
          createdAt: Date.now()
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('ai-canvas-users', JSON.stringify(updatedUsers));
        
        const { password: _, ...sessionUser } = newUser;
        localStorage.setItem('ai-canvas-session', JSON.stringify(sessionUser));
        
        set({ users: updatedUsers, currentUser: newUser, isAuthenticated: true });
        resolve(true);
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem('ai-canvas-session');
    set({ currentUser: null, isAuthenticated: false });
  },

  resetPassword: async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const { users } = get();
        if (users.find(u => u.email === email)) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  },

  getAllUsers: () => {
    return get().users;
  }
}));
