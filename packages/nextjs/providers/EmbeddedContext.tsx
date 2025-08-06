import { createContext, useContext } from "react";

const EmbeddedContext = createContext(true);

export const EmbeddedProvider = ({ children }) => {
  const isEmbedded = localStorage.getItem("embedded") === "true";

  return <EmbeddedContext.Provider value={isEmbedded}>{children}</EmbeddedContext.Provider>;
};

export const useEmbedded = () => {
  const context = useContext(EmbeddedContext);
  if (context === null) {
    throw new Error("useEmbedded must be used within an <EmbeddedProvider>");
  }
  return context;
};
