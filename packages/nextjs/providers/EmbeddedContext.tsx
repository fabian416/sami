import { createContext, useContext, useEffect, useState } from "react";

interface EmbeddedProviderProps {
  children: React.ReactNode;
}

const EmbeddedContext = createContext<string | boolean | null | undefined>(true);

export const EmbeddedProvider: React.FC<EmbeddedProviderProps> = ({ children }) => {
  const isEmbedded = localStorage.getItem("embedded");
  return <EmbeddedContext.Provider value={isEmbedded}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
