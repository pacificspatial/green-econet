import { basemapStyles } from "@/constants/basemapStyles";
import type { BasemapContextType } from "@/types/BasemapContext";
import React, { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const BasemapContext = createContext<BasemapContextType | undefined>(undefined);

interface BasemapProviderProps {
  children: ReactNode;
}

export const BasemapProvider: React.FC<BasemapProviderProps> = ({
  children,
}) => {
  const fallback = "mapbox://styles/mapbox/streets-v12";

  const getInitialBasemap = () => {
    const stored = localStorage.getItem("basemap");
    return stored && basemapStyles.some((style) => style.value === stored)
      ? stored
      : fallback;
  };

  const [basemap, setBasemap] = useState<string>(() => getInitialBasemap());

  useEffect(() => {
    if (basemap && basemap !== "") {
      localStorage.setItem("basemap", basemap);
    }
  }, [basemap]);

  return (
    <BasemapContext.Provider value={{ basemap, setBasemap }}>
      {children}
    </BasemapContext.Provider>
  );
};

export default BasemapContext;
