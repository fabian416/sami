import { createContext, useContext, useEffect, useState } from "react";

const EmbeddedContext = createContext(true);

export const EmbeddedProvider = ({ children }) => {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const embedded = localStorage.getItem("embedded") === "true";
    setIsEmbedded(embedded);
  }, []);

  return <EmbeddedContext.Provider value={isEmbedded}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
