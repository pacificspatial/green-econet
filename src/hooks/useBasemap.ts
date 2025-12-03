import BasemapContext from "@/context/BasemapProvider";
import type { BasemapContextType } from "@/types/BasemapContext";
import { useContext } from "react";

// Custom hook to use the BasemapContext
export const useBasemap = (): BasemapContextType => {
  const context = useContext(BasemapContext);
  if (!context) {
    throw new Error("useBasemap must be used within a BasemapProvider");
  }
  return context;
};
