import { useEffect, useRef } from "react";
import { initializeMap } from "@/utils/map/mapUtils";
import "mapbox-gl/dist/mapbox-gl.css";
import { useBasemap } from "@/hooks/useBasemap";

interface MergedItemsMapProp {
  center: [number, number];
  zoom: number;
}

export const MergedItemsMap: React.FC<MergedItemsMapProp> = ({ 
  center, 
  zoom,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { basemap } = useBasemap();
  
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map using the helper function
    mapRef.current = initializeMap({
      container: mapContainerRef.current,
      center: center,
      zoom: zoom,
      basemap: basemap,
      highResolution: true,
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom, basemap]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    />
  );
};