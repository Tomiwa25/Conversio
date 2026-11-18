'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '@conversio/shared';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

  // Load session from storage on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('conversio_access_token') : null;

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setAccessToken(savedToken);

    fetch(`${serverUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          localStorage.removeItem('conversio_access_token');
          setAccessToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        // Network error / offline
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [serverUrl]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to sign in');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('conversio_access_token', data.accessToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to create account');
      }

      setUser(data.user);
      setAccessToken(data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('conversio_access_token', data.accessToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<string> => {
    const res = await fetch(`${serverUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to request password reset');
    }

    return data.message || 'Instructions have been dispatched to your email.';
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    const res = await fetch(`${serverUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || data.error || 'Failed to reset password');
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('conversio_access_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
