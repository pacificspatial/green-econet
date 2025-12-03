import { createContext, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { defaultTheme, darkTheme } from "@/themes/index";
import type { ThemeContextType } from "@/types/ThemeContext";

// Create the context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Create the provider component
export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const themeMode = useMemo(
    () => (theme === "light" ? defaultTheme : darkTheme),
    [theme]
  );

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider theme={themeMode}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
