import { useEffect } from "react";

export const useLineDrawButtonTooltip = (translation: string, selectedTab: string) => {
  useEffect(() => {
    if (selectedTab !== "simulation") return;
    
    const setTooltip = () => {
      const lineBtn = document.querySelector(
        ".mapbox-gl-draw_ctrl-draw-btn.mapbox-gl-draw_line"
      ) as HTMLElement | null;

      if (lineBtn) {
        lineBtn.removeAttribute("title");
        lineBtn.setAttribute("data-tooltip", translation);
        return true;
      }
      return false;
    };

    if (!setTooltip()) {
      const timeoutId = setTimeout(() => {
        setTooltip();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [translation, selectedTab]); 
};