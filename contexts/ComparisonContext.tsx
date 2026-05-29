import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Candidate } from '../types';

interface ComparisonContextType {
  comparisonList: Candidate[];
  toggleComparison: (candidate: Candidate) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const useComparison = () => {
  const ctx = useContext(ComparisonContext);
  if (!ctx) throw new Error('useComparison must be used within ComparisonProvider');
  return ctx;
};

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [comparisonList, setComparisonList] = useState<Candidate[]>([]);

  const toggleComparison = (candidate: Candidate) => {
    setComparisonList(prev => {
      const exists = prev.some(c => c.id === candidate.id);
      if (exists) return prev.filter(c => c.id !== candidate.id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, candidate];
    });
  };

  const clearComparison = () => setComparisonList([]);

  const isInComparison = (id: string) => comparisonList.some(c => c.id === id);

  return (
    <ComparisonContext.Provider value={{ comparisonList, toggleComparison, clearComparison, isInComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};
