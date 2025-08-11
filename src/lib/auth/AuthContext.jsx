import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'bvote_auth_status';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const API_VERIFY_KEY = API_ENDPOINTS.adminVerifyKey || '/.netlify/functions/admin-verify-key';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      return storedAuth ? JSON.parse(storedAuth) : false;
    } catch (error) {
      console.error("Could not parse auth status from localStorage", error);
      return false;
    }
  });

  // No longer store keys in localStorage in production

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(isAuthenticated));
    } catch (error) {
      console.error("Could not save auth status to localStorage", error);
    }
  }, [isAuthenticated]);

  const login = async (key) => {
    try {
      const res = await fetch(API_VERIFY_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Admin login failed:', e);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};