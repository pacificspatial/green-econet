import { Geometry } from "@/types/Region";
import { fitBoundsToGeometry } from "./fitBoundsToGeometry";

export const handleDraftAOIVisualization = (
  map: mapboxgl.Map | null,
  drawInstance: MapboxDraw | null,
  draftAoi: Geometry | null
) => {  
  if (!map || !drawInstance || !draftAoi) {
    console.error('Missing required parameters for draft AOI visualization');
    return false;
  }

  if (!('deleteAll' in drawInstance) || typeof drawInstance.deleteAll !== 'function') {
    console.error('Draw instance not properly initialized');
    return false;
  }

  try {
    drawInstance.deleteAll();
    
    drawInstance.add({
      id: 'draft-aoi',
      type: 'Feature',
      geometry: draftAoi,
      properties: {},
    });

    fitBoundsToGeometry(map, draftAoi);
    return true;
  } catch (error) {
    console.error('Error adding draft AOI:', error);
    return false;
  }
};