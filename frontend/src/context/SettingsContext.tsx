'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  warningThreshold: number;
  criticalThreshold: number;
  setWarningThreshold: (val: number) => void;
  setCriticalThreshold: (val: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(85);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const warning = localStorage.getItem('warn_threshold');
    const critical = localStorage.getItem('crit_threshold');
    if (warning) setWarningThreshold(parseInt(warning, 10));
    if (critical) setCriticalThreshold(parseInt(critical, 10));
  }, []);

  const changeWarning = (val: number) => {
    setWarningThreshold(val);
    localStorage.setItem('warn_threshold', val.toString());
  };

  const changeCritical = (val: number) => {
    setCriticalThreshold(val);
    localStorage.setItem('crit_threshold', val.toString());
  };

  return (
    <SettingsContext.Provider
      value={{
        warningThreshold,
        criticalThreshold,
        setWarningThreshold: changeWarning,
        setCriticalThreshold: changeCritical,
        isSettingsOpen,
        setIsSettingsOpen,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
