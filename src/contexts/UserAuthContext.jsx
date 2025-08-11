import React, { createContext, useState, useContext, useEffect } from 'react';
import { useEventBus } from '@/contexts/AppContext';

const UserAuthContext = createContext(null);

const USER_AUTH_STORAGE_KEY = 'bvote_user_auth';

export const UserAuthProvider = ({ children }) => {
  const EventBus = useEventBus();

  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem(USER_AUTH_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Could not parse user auth from sessionStorage", error);
      return null;
    }
  });

  const isUserAuthenticated = !!user;

  useEffect(() => {
    try {
      if (user) {
        sessionStorage.setItem(USER_AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(USER_AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Could not save user auth to sessionStorage", error);
    }
  }, [user]);

  // Sync with global EventBus for auto-login / external updates
  useEffect(() => {
    const unsubLogin = EventBus.subscribe('user_login', (userData) => {
      if (userData) setUser(userData);
    });
    const unsubLogout = EventBus.subscribe('user_logout', () => {
      setUser(null);
    });
    return () => { unsubLogin(); unsubLogout(); };
  }, [EventBus]);

  const login = (userData) => {
    setUser(userData);
    EventBus.dispatch('user_login', userData);
  };

  const logout = () => {
    EventBus.dispatch('user_logout', user);
    setUser(null);
  };

  return (
    <UserAuthContext.Provider value={{ isUserAuthenticated, user, login, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};