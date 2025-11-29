import * as turf from "@turf/turf";
import { createCanvas, loadImage } from "canvas";
import axios from "axios";

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

export const rowsToGeoJSON = (rows, layerType) => ({
  type: "FeatureCollection",
  features: rows.map((r) => ({
    type: "Feature",
    geometry:
      typeof r.geom === "string"
        ? JSON.parse(r.geom)
        : r.geom, 
    properties: {
      layerType
    },
  })),
});

/**
 * Convert lat/lng to tile coordinates
 */
const latLngToTile = (lat, lng, zoom) => {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
};

/**
 * Convert tile coordinates to lat/lng
 */
const tileToLatLng = (x, y, zoom) => {
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, zoom);
  const lat = (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  const lng = x / Math.pow(2, zoom) * 360 - 180;
  return { lat, lng };
};

/**
 * Download a map tile from Mapbox Streets v12
 */
const downloadTile = async (x, y, zoom) => {
  try {
    const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/${zoom}/${x}/${y}?access_token=${MAPBOX_ACCESS_TOKEN}`;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Failed to download tile ${x},${y},${zoom}:`, error.message);
    return null;
  }
};

/**
 * Layer configurations
 */
const LAYER_STYLES = {
  'clipped-buffer-125-green': {
    fillColor: '#C2E2FE',
    strokeColor: '#C2E2FE',
    lineWidth: 2,
    fillOpacity: 0.6
  },
  'clipped-green': {
    fillColor: '#386B24',
    strokeColor: '#386B24',
    lineWidth: 2,
    fillOpacity: 0.6
  },
  'project-boundary': {
    fillColor: null,
    strokeColor: '#000000',
    lineWidth: 3
  },
  'merged-buffer125-green': {
    fillColor: '#C2E2FE',
    strokeColor: '#C2E2FE',
    lineWidth: 2,
    fillOpacity: 0.6
  },
  'merged-green': {
    fillColor: '#386B24',
    strokeColor: '#386B24',
    lineWidth: 2,
    fillOpacity: 0.6
  }
};

/**
 * Helper function to draw a polygon on canvas with specific style
 */
const drawPolygon = (ctx, coordinates, project, style) => {
  // Save the current context state
  ctx.save();
  
  // Apply opacity if specified
  if (style.fillOpacity !== undefined) {
    ctx.globalAlpha = style.fillOpacity;
  }
  
  coordinates.forEach((ring, ringIdx) => {
    ctx.beginPath();
    
    ring.forEach(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.closePath();
    
    if (ringIdx === 0 && style.fillColor) {
      ctx.fillStyle = style.fillColor;
      ctx.fill();
    }
    
    // Reset opacity for stroke (strokes should be opaque)
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.lineWidth;
    ctx.stroke();
  });
  
  // Restore the context state
  ctx.restore();
};

/**
 * Calculate optimal zoom level - more aggressive zooming
 */
const calculateOptimalZoom = (bbox, width, height, paddingPercent = 0.1) => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  const lngPadding = (maxLng - minLng) * paddingPercent;
  const latPadding = (maxLat - minLat) * paddingPercent;
  
  const paddedMinLng = minLng - lngPadding;
  const paddedMaxLng = maxLng + lngPadding;
  const paddedMinLat = minLat - latPadding;
  const paddedMaxLat = maxLat + latPadding;
  
  const lngDiff = paddedMaxLng - paddedMinLng;
  const latDiff = paddedMaxLat - paddedMinLat;
  
  const WORLD_DIM = { height: 256, width: 256 };
  
  function latRad(lat) {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }
  
  function zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }
  
  const latFraction = (latRad(paddedMaxLat) - latRad(paddedMinLat)) / Math.PI;
  const lngFraction = lngDiff / 360;
  
  const latZoom = zoom(height, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(width, WORLD_DIM.width, lngFraction);
  
  return Math.min(latZoom, lngZoom, 18);
};

/**
 * Render map image with improved centering and zoom
 */
export const renderMapImage = async (clippedBuffer125GeoJSON, clippedGreenGeoJSON, projectGeoJSON) => {
  const width = 1200;
  const height = 1200;
  const tileSize = 512;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, width, height);

  // Combine all GeoJSON for bbox calculation
  const combinedGeoJSON = {
    type: "FeatureCollection",
    features: [
      ...clippedBuffer125GeoJSON.features,
      ...clippedGreenGeoJSON.features,
      ...projectGeoJSON.features
    ]
  };

  let bbox;
  try {
    bbox = turf.bbox(combinedGeoJSON);
  } catch (e) {
    console.error("Error calculating bbox:", e);
    return canvas.toBuffer('image/png');
  }

  const [minLng, minLat, maxLng, maxLat] = bbox;

  if (minLng === maxLng || minLat === maxLat) {
    console.log("Bounding box is too small, cannot render map");
    return canvas.toBuffer('image/png');
  }

  // Use generous padding so layers fit comfortably within the image (25% padding)
  const zoom = calculateOptimalZoom(bbox, width, height, 0.25);
  
  console.log(`Using zoom level: ${zoom}`);

  // Calculate precise center point
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // Convert center to pixel coordinates in Web Mercator at this zoom
  const scale = Math.pow(2, zoom) * tileSize;
  const worldX = (centerLng + 180) / 360 * scale;
  const sinLat = Math.sin(centerLat * Math.PI / 180);
  const worldY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;

  // Calculate tile range to cover canvas centered on this point
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const minWorldX = worldX - halfWidth;
  const maxWorldX = worldX + halfWidth;
  const minWorldY = worldY - halfHeight;
  const maxWorldY = worldY + halfHeight;

  const startTileX = Math.floor(minWorldX / tileSize);
  const endTileX = Math.ceil(maxWorldX / tileSize);
  const startTileY = Math.floor(minWorldY / tileSize);
  const endTileY = Math.ceil(maxWorldY / tileSize);

  const tilesX = endTileX - startTileX;
  const tilesY = endTileY - startTileY;

  // Offset to center the tiles properly
  const offsetX = -(minWorldX - startTileX * tileSize);
  const offsetY = -(minWorldY - startTileY * tileSize);

  // Download and draw base map tiles
  console.log(`Downloading ${tilesX * tilesY} Mapbox tiles at zoom ${zoom}...`);
  
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tileX = startTileX + tx;
      const tileY = startTileY + ty;
      
      const tileBuffer = await downloadTile(tileX, tileY, zoom);
      
      if (tileBuffer) {
        try {
          const img = await loadImage(tileBuffer);
          const pixelX = tx * tileSize + offsetX;
          const pixelY = ty * tileSize + offsetY;
          ctx.drawImage(img, pixelX, pixelY, tileSize, tileSize);
        } catch (e) {
          console.error(`Failed to load tile image: ${e.message}`);
        }
      }
    }
  }

  // Create projection function using the same coordinate system
  const project = (lng, lat) => {
    const px = (lng + 180) / 360 * scale;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const py = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
    
    const x = (px - minWorldX);
    const y = (py - minWorldY);
    
    return [x, y];
  };

  // Draw layers in order
  const layersToRender = [
    { geojson: clippedBuffer125GeoJSON, style: LAYER_STYLES['clipped-buffer-125-green'] },
    { geojson: clippedGreenGeoJSON, style: LAYER_STYLES['clipped-green'] },
    { geojson: projectGeoJSON, style: LAYER_STYLES['project-boundary'] }
  ];

  layersToRender.forEach(({ geojson, style }) => {
    geojson.features.forEach(feature => {
      const geom = feature.geometry;
      
      if (!geom || !geom.type) {
        return;
      }

      try {
        if (geom.type === 'Polygon') {
          drawPolygon(ctx, geom.coordinates, project, style);
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(polygon => {
            drawPolygon(ctx, polygon, project, style);
          });
        } else if (geom.type === 'LineString') {
          ctx.beginPath();
          geom.coordinates.forEach(([lng, lat], i) => {
            const [x, y] = project(lng, lat);
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.strokeStyle = style.strokeColor;
          ctx.lineWidth = style.lineWidth;
          ctx.stroke();
        }
      } catch (e) {
        console.error("Error drawing feature:", e);
      }
    });
  });

  return canvas.toBuffer('image/png');
};