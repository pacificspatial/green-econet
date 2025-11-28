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
      layerType // Add layer type to properties
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
    // Mapbox Streets v12 tile URL
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
 * Layer configurations matching the TypeScript configs
 */
const LAYER_STYLES = {
  'clipped-buffer-125-green': {
    fillColor: 'rgba(76, 175, 80, 0.6)',
    strokeColor: '#2E7D32',
    lineWidth: 2
  },
  'clipped-green': {
    fillColor: 'rgba(21, 101, 192, 0.6)',
    strokeColor: '#1565C0',
    lineWidth: 2
  },
  'project-boundary': {
    fillColor: null,
    strokeColor: '#000000',
    lineWidth: 3
  },

  // NEW: merged layer styles for Canvas rendering
  'merged-buffer125-green': {
    fillColor: 'rgba(195, 228, 253, 0.6)',
    strokeColor: '#C3E4FD',
    lineWidth: 2
  },
  'merged-green': {
    fillColor: 'rgba(51, 109, 26, 0.6)',
    strokeColor: '#336D1A',
    lineWidth: 2
  }
};


/**
 * Helper function to draw a polygon on canvas with specific style
 */
const drawPolygon = (ctx, coordinates, project, style) => {
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
    
    // Fill only the outer ring (first ring) and only if fillColor is specified
    if (ringIdx === 0 && style.fillColor) {
      ctx.fillStyle = style.fillColor;
      ctx.fill();
    }
    
    // Stroke all rings (outer and holes)
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.lineWidth;
    ctx.stroke();
  });
};

/**
 * Calculate optimal zoom level for features
 */
const calculateOptimalZoom = (bbox, width, height, paddingPercent = 0.15) => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  
  // Moderate padding to center and zoom appropriately
  const lngPadding = (maxLng - minLng) * paddingPercent;
  const latPadding = (maxLat - minLat) * paddingPercent;
  
  const paddedMinLng = minLng - lngPadding;
  const paddedMaxLng = maxLng + lngPadding;
  const paddedMinLat = minLat - latPadding;
  const paddedMaxLat = maxLat + latPadding;
  
  const lngDiff = paddedMaxLng - paddedMinLng;
  const latDiff = paddedMaxLat - paddedMinLat;
  
  // Calculate zoom based on Web Mercator projection
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
  
  // Use calculated zoom, max 18
  return Math.min(latZoom, lngZoom, 18);
};

/**
 * Render map image with Mapbox Streets base map and GeoJSON overlay
 */
export const renderMapImage = async (clippedBuffer125GeoJSON, clippedGreenGeoJSON, projectGeoJSON) => {
  const width = 800;
  const height = 800; // Square image
  const tileSize = 512; // Mapbox uses 512x512 tiles

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background with light color
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

  // Calculate bounding box
  let bbox;
  try {
    bbox = turf.bbox(combinedGeoJSON);
  } catch (e) {
    console.error("Error calculating bbox:", e);
    return canvas.toBuffer('image/png');
  }

  const [minLng, minLat, maxLng, maxLat] = bbox;

  // Handle edge case where bbox might be a point
  if (minLng === maxLng || minLat === maxLat) {
    console.log("Bounding box is too small, cannot render map");
    return canvas.toBuffer('image/png');
  }

  // Calculate optimal zoom level with 5% padding for more zoom
  const zoom = calculateOptimalZoom(bbox, width, height, 0.05);
  
  console.log(`Using zoom level: ${zoom}`);

  // Calculate center point from the bounding box
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  // Get tile coordinates for the center
  const centerTile = latLngToTile(centerLat, centerLng, zoom);

  // Calculate how many tiles we need to cover the canvas
  const tilesX = Math.ceil(width / tileSize) + 1;
  const tilesY = Math.ceil(height / tileSize) + 1;
  
  // Center the tiles around the centerTile for proper centering
  const startTileX = centerTile.x - Math.floor(tilesX / 2);
  const startTileY = centerTile.y - Math.floor(tilesY / 2);

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
          const pixelX = tx * tileSize;
          const pixelY = ty * tileSize;
          ctx.drawImage(img, pixelX, pixelY, tileSize, tileSize);
        } catch (e) {
          console.error(`Failed to load tile image: ${e.message}`);
        }
      }
    }
  }

  // Now create projection for overlay - use bbox center for better alignment
  const topLeftTile = tileToLatLng(startTileX, startTileY, zoom);
  const bottomRightTile = tileToLatLng(startTileX + tilesX, startTileY + tilesY, zoom);

  const mapMinLng = topLeftTile.lng;
  const mapMaxLat = topLeftTile.lat;
  const mapMaxLng = bottomRightTile.lng;
  const mapMinLat = bottomRightTile.lat;

  // Projection function for GeoJSON overlay - ensures proper centering
  const project = (lng, lat) => {
    const x = ((lng - mapMinLng) / (mapMaxLng - mapMinLng)) * width;
    const y = ((mapMaxLat - lat) / (mapMaxLat - mapMinLat)) * height;
    return [x, y];
  };

  // Draw layers in order: clippedBuffer125, clippedGreen, then project boundary
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
          // Handle LineString for project boundary if needed
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