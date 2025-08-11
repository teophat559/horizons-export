import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'bvote_auth_status';
const ADMIN_KEYS_STORAGE_KEY = 'bvote_admin_keys';

const getDefaultKeys = () => {
  return [{ id: Date.now(), value: 'admin123' }];
};

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

  const [adminKeys, setAdminKeys] = useState(() => {
    try {
      const savedKeys = localStorage.getItem(ADMIN_KEYS_STORAGE_KEY);
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys);
        return Array.isArray(parsedKeys) && parsedKeys.length > 0 ? parsedKeys : getDefaultKeys();
      }
      const defaultKeys = getDefaultKeys();
      localStorage.setItem(ADMIN_KEYS_STORAGE_KEY, JSON.stringify(defaultKeys));
      return defaultKeys;
    } catch (error) {
      console.error("Failed to load admin keys from localStorage", error);
      return getDefaultKeys();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(isAuthenticated));
    } catch (error) {
      console.error("Could not save auth status to localStorage", error);
    }
  }, [isAuthenticated]);

  const login = (key) => {
    // Refresh keys from storage in case they were changed in another tab
    const currentKeysStr = localStorage.getItem(ADMIN_KEYS_STORAGE_KEY);
    const currentKeys = currentKeysStr ? JSON.parse(currentKeysStr) : getDefaultKeys();
    setAdminKeys(currentKeys);

    const isValid = currentKeys.some(k => k.value === key);
    if (isValid) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
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
  return useContext(AuthContext);
};