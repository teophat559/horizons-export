import React, { createContext, useContext } from 'react';

export const EventBus = {
  events: {},
  dispatch(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  },
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }
};

const AppContext = createContext({ EventBus });

export const AppProvider = ({ children }) => {
  return (
    <AppContext.Provider value={{ EventBus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useEventBus = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useEventBus must be used within an AppProvider');
  }
  return context.EventBus;
};