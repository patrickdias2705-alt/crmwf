import React, { createContext, useContext, useState, useEffect } from 'react';

interface ValuesVisibilityContextType {
  valuesVisible: boolean;
  toggleValuesVisibility: () => void;
}

const ValuesVisibilityContext = createContext<ValuesVisibilityContextType | undefined>(undefined);

export function ValuesVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [valuesVisible, setValuesVisible] = useState(() => {
    // Carregar do localStorage ou usar true como padrão
    const saved = localStorage.getItem('valuesVisible');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleValuesVisibility = () => {
    setValuesVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('valuesVisible', newValue.toString());
      return newValue;
    });
  };

  return (
    <ValuesVisibilityContext.Provider value={{ valuesVisible, toggleValuesVisibility }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext);
  if (context === undefined) {
    throw new Error('useValuesVisibility must be used within a ValuesVisibilityProvider');
  }
  return context;
}
