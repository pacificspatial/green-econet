// src/utils/map/mapSync.ts
import type maplibregl from "maplibre-gl";

let leftMap: maplibregl.Map | null = null;
let rightMap: maplibregl.Map | null = null;
let isSyncing = false;

/**
 * Register/unregister the LEFT map (ClippedItemsMap)
 */
export const registerLeftMap = (map: maplibregl.Map | null) => {
  leftMap = map;
};

/**
 * Register/unregister the RIGHT map (MergedItemsMap)
 */
export const registerRightMap = (map: maplibregl.Map | null) => {
  rightMap = map;
};

/**
 * Sync movement from LEFT → RIGHT
 */
export const syncFromLeft = () => {
  if (!leftMap || !rightMap || isSyncing) return;

  isSyncing = true;
  try {
    rightMap.jumpTo({
      center: leftMap.getCenter(),
      zoom: leftMap.getZoom(),
      bearing: leftMap.getBearing(),
      pitch: leftMap.getPitch(),
    });
  } finally {
    isSyncing = false;
  }
};

/**
 * Sync movement from RIGHT → LEFT
 */
export const syncFromRight = () => {
  if (!leftMap || !rightMap || isSyncing) return;

  isSyncing = true;
  try {
    leftMap.jumpTo({
      center: rightMap.getCenter(),
      zoom: rightMap.getZoom(),
      bearing: rightMap.getBearing(),
      pitch: rightMap.getPitch(),
    });
  } finally {
    isSyncing = false;
  }
};
