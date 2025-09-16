import { createContext, useContext, useEffect, useState } from "react";

interface ContextType {
  isEmbedded: string | boolean | null;
}

const EmbeddedContext = createContext<ContextType | null>(null);

export const EmbeddedProvider = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = useState<string | boolean | null>(true);

  useEffect(() => {
    const embedded = localStorage.getItem("embedded");
    setIsEmbedded(true);
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
