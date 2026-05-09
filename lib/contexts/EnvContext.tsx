'use client';

import { createContext, useContext } from 'react';

interface EnvContextType {
  showNumbers: boolean;
}

const EnvContext = createContext<EnvContextType | undefined>(undefined);

export function EnvProvider({ children, showNumbers }: { children: React.ReactNode; showNumbers: boolean }) {
  return (
    <EnvContext.Provider value={{ showNumbers }}>
      {children}
    </EnvContext.Provider>
  );
}

export function useEnv() {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error('useEnv must be used within EnvProvider');
  }
  return context;
}
