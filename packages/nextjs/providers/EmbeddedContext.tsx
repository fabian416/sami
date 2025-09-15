import { createContext, useContext, useEffect, useState } from "react";

interface ContextType {
  isEmbedded: string | null;
}

const EmbeddedContext = createContext<ContextType | null>(null);

export const EmbeddedProvider = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = useState<string | null>(null);

  useEffect(() => {
    const embedded = localStorage.getItem("embedded");
    setIsEmbedded(embedded);
  }, []);

  return <EmbeddedContext.Provider value={{ isEmbedded }}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
