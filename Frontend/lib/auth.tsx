// lib/auth.tsx

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiPost, apiGet } from "./api";

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export function getDefaultRoute(role?: string | null) {
  return role === "admin" ? "/admin_dashboard" : "/dashboard";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Read from localStorage on mount
    const savedToken = localStorage.getItem("espressopro_token");
    const savedUser = localStorage.getItem("espressopro_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem("espressopro_token");
        localStorage.removeItem("espressopro_user");
      }
    }
    setLoading(false);
  }, []);

  // Protected route handling
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === "/login";
    const defaultRoute = getDefaultRoute(user?.role ?? null);
    
    if (!token && !isAuthPage) {
      router.replace("/login");
    } else if (token && isAuthPage) {
      router.replace(defaultRoute);
    }
  }, [token, user, pathname, loading, router]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      // Build form data for OAuth2 authentication
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      interface LoginResponse {
        access_token: string;
        role: string;
        full_name: string;
      }

      const data = await apiPost<LoginResponse>("/api/v1/auth/login", formData);
      
      const userProfile: User = {
        id: "", // Loaded from /auth/me or empty
        username,
        full_name: data.full_name,
        role: data.role,
        is_active: true,
      };

      // Get complete profile info
      try {
        const fullProfile = await apiGet<User>("/api/v1/auth/me", { token: data.access_token });
        userProfile.id = fullProfile.id;
        userProfile.is_active = fullProfile.is_active;
        userProfile.full_name = fullProfile.full_name;
      } catch (profileError) {
        console.error("Failed to load full profile", profileError);
      }

      // Save states
      setToken(data.access_token);
      setUser(userProfile);
      localStorage.setItem("espressopro_token", data.access_token);
      localStorage.setItem("espressopro_user", JSON.stringify(userProfile));
      
      router.replace(getDefaultRoute(userProfile.role));
    } catch (err) {
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("espressopro_token");
    localStorage.removeItem("espressopro_user");
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
