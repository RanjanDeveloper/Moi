"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ContributorHistorySheet } from "@/components/contributor-history-sheet";

interface ContributorHistoryContextType {
  openContributorHistory: (name: string) => void;
  closeContributorHistory: () => void;
}

const ContributorHistoryContext = createContext<ContributorHistoryContextType | undefined>(undefined);

export function ContributorHistoryProvider({ children }: { children: ReactNode }) {
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);

  const openContributorHistory = (name: string) => {
    setSelectedContributor(name);
  };

  const closeContributorHistory = () => {
    setSelectedContributor(null);
  };

  return (
    <ContributorHistoryContext.Provider value={{ openContributorHistory, closeContributorHistory }}>
      {children}
      <ContributorHistorySheet
        isOpen={!!selectedContributor}
        contributorName={selectedContributor}
        onClose={closeContributorHistory}
      />
    </ContributorHistoryContext.Provider>
  );
}

export function useContributorHistory() {
  const context = useContext(ContributorHistoryContext);
  if (context === undefined) {
    throw new Error("useContributorHistory must be used within a ContributorHistoryProvider");
  }
  return context;
}
