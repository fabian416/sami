"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type EmbeddedContextValue = string;

interface EmbeddedProviderProps {
  children: React.ReactNode;
}

const EmbeddedContext = createContext<EmbeddedContextValue | null>(null);

export const EmbeddedProvider: React.FC<EmbeddedProviderProps> = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = useState<EmbeddedContextValue | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("embedded");
  });

  useEffect(() => {
    const embedded = localStorage.getItem("embedded");
    setIsEmbedded(embedded);
  }, []);

  return <EmbeddedContext.Provider value={isEmbedded}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = (): EmbeddedContextValue => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
