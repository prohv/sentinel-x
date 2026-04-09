'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BatchPurgeContextType {
  isBatchMode: boolean;
  setBatchMode: (val: boolean) => void;
  selectedIds: string[];
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

const BatchPurgeContext = createContext<BatchPurgeContextType | undefined>(
  undefined,
);

export function BatchPurgeProvider({ children }: { children: ReactNode }) {
  const [isBatchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAll = (ids: string[]) => {
    if (selectedIds.length === ids.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...ids]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleSetBatchMode = (val: boolean) => {
    if (!val) clearSelection();
    setBatchMode(val);
  };

  return (
    <BatchPurgeContext.Provider
      value={{
        isBatchMode,
        setBatchMode: handleSetBatchMode,
        selectedIds,
        toggleSelection,
        selectAll,
        clearSelection,
      }}
    >
      {children}
    </BatchPurgeContext.Provider>
  );
}

export function useBatchPurge() {
  const context = useContext(BatchPurgeContext);
  if (!context) {
    throw new Error('useBatchPurge must be used within a BatchPurgeProvider');
  }
  return context;
}
