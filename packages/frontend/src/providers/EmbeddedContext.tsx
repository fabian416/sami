import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface ContractsProviderProps {
  children: ReactNode;
}

interface ContextType {
  isEmbedded: string | boolean | null;
}

const EmbeddedContext = createContext<ContextType | null>(null);


const NOT_EMBEDDED_ROUTES = new Set<string>(["/not-embedded"]);

export const EmbeddedProvider: React.FC<ContractsProviderProps> = ({ children }) => {
  const { pathname } = useLocation();
  const isEmbedded = !NOT_EMBEDDED_ROUTES.has(pathname);

  return <EmbeddedContext.Provider value={{ isEmbedded }}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
