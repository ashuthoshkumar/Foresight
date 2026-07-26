import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../../api/client';

interface User {
  email: string;
  name: string;
  tier: 'free' | 'pro';
  is_admin: boolean;
  credits_used_today?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('foresight_token');
      if (storedToken) {
        try {
          const res = await api.getProfile();
          if (res.success) {
            setToken(storedToken);
            setUser(res.user);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Auth validation failed:", error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = (newToken: string, newUser: User) => {
    localStorage.setItem('foresight_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('foresight_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
