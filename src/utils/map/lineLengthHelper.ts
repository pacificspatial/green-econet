import { length, along, lineString } from '@turf/turf';
import type { Position } from 'geojson';
import { Geometry } from '@/types/Region';
import { LENGTH_INCREMENT } from '@/constants/numberConstants';

export const adjustLineString = (
  geometry: Geometry,
  originalGeometry?: Geometry
): {
  adjustedGeometry: Geometry;
  originalLength: number;
  updatedLength: number;
} => {
  if (geometry.type !== 'LineString') {
    throw new Error('Geometry must be a LineString');
  }

  const coords = geometry.coordinates as Position[];

  if (coords.length < 2) {
    return {
      adjustedGeometry: geometry,
      originalLength: 0,
      updatedLength: 0,
    };
  }

  const line = lineString(coords);
  const originalLength = length(line, { units: 'meters' });
  let targetLength = Math.round(originalLength / LENGTH_INCREMENT) * LENGTH_INCREMENT;

  if (targetLength === 0 || targetLength < LENGTH_INCREMENT) {
    targetLength = LENGTH_INCREMENT;
  }

  if (originalLength === targetLength) {
    return {
      adjustedGeometry: geometry,
      originalLength,
      updatedLength: targetLength,
    };
  }

  const difference = targetLength - originalLength;
  
  // Determine which end was edited (for updates) or default to end (for creation)
  const adjustFromStart = originalGeometry ? wasStartEdited(geometry, originalGeometry) : false;
  
  // Apply constraint by removing complete segments from the appropriate end
  const adjustedGeometry = adjustByRemovingSegments(coords, difference, adjustFromStart);

  return {
    adjustedGeometry,
    originalLength,
    updatedLength: targetLength,
  };
};

/**
 * Check if the start point was edited by comparing with original geometry
 */
const wasStartEdited = (newGeometry: Geometry, originalGeometry: Geometry): boolean => {
  if (originalGeometry.type !== 'LineString' || newGeometry.type !== 'LineString') {
    return false;
  }

  const newCoords = newGeometry.coordinates as Position[];
  const oldCoords = originalGeometry.coordinates as Position[];

  if (newCoords.length !== oldCoords.length) {
    return false;
  }

  const tolerance = 0.000001;
  
  // Check if start point changed
  const startChanged = Math.abs(newCoords[0][0] - oldCoords[0][0]) > tolerance || 
                      Math.abs(newCoords[0][1] - oldCoords[0][1]) > tolerance;
  
  // Check if end point changed  
  const endChanged = Math.abs(newCoords[newCoords.length - 1][0] - oldCoords[oldCoords.length - 1][0]) > tolerance ||
                    Math.abs(newCoords[newCoords.length - 1][1] - oldCoords[oldCoords.length - 1][1]) > tolerance;

  // If only start changed, adjust from start. Otherwise default to end.
  return startChanged && !endChanged;
};

/**
 * Adjust line by removing complete segments from the specified end
 */
const adjustByRemovingSegments = (coords: Position[], difference: number, fromStart: boolean): Geometry => {
  if (difference > 0) {
    // Need to extend the line
    return extendLine(coords, difference, fromStart);
  } else {
    // Need to trim the line by removing complete segments
    return trimLineByRemovingSegments(coords, Math.abs(difference), fromStart);
  }
};

/**
 * Extend the line from the specified end
 */
const extendLine = (coords: Position[], extensionDistance: number, fromStart: boolean): Geometry => {
  if (fromStart) {
    // Extend from start
    const firstSeg = lineString([coords[0], coords[1]]);
    const segLength = length(firstSeg, { units: 'meters' });
    const extendRatio = (segLength + extensionDistance) / segLength;
    
    const dx = coords[0][0] - coords[1][0];
    const dy = coords[0][1] - coords[1][1];
    
    const newStart: Position = [
      coords[1][0] + dx * extendRatio,
      coords[1][1] + dy * extendRatio,
    ];
    
    return {
      type: 'LineString',
      coordinates: [newStart, ...coords.slice(1)]
    };
  } else {
    // Extend from end
    const lastSeg = lineString([coords[coords.length - 2], coords[coords.length - 1]]);
    const segLength = length(lastSeg, { units: 'meters' });
    const extendRatio = (segLength + extensionDistance) / segLength;
    
    const dx = coords[coords.length - 1][0] - coords[coords.length - 2][0];
    const dy = coords[coords.length - 1][1] - coords[coords.length - 2][1];
    
    const newEnd: Position = [
      coords[coords.length - 2][0] + dx * extendRatio,
      coords[coords.length - 2][1] + dy * extendRatio,
    ];
    
    return {
      type: 'LineString',
      coordinates: [...coords.slice(0, -1), newEnd]
    };
  }
};

/**
 * Trim line by removing complete segments from the specified end
 */
const trimLineByRemovingSegments = (coords: Position[], trimDistance: number, fromStart: boolean): { type: 'LineString'; coordinates: Position[] } => {
  let workingCoords = [...coords];
  let accumulatedLength = 0;
  
  if (fromStart) {
    let i = 0;
    while (i < workingCoords.length - 1) {
      const segment = lineString([workingCoords[i], workingCoords[i + 1]]);
      const segmentLength = length(segment, { units: 'meters' });
      
      if (accumulatedLength + segmentLength < trimDistance) {
        accumulatedLength += segmentLength;
        i++;
      } else {
        const remainingTrim = trimDistance - accumulatedLength;
        
        if (remainingTrim > 0) {
          const newStartPoint = along(segment, remainingTrim, { units: 'meters' });
          workingCoords = [
            newStartPoint.geometry.coordinates as Position,
            ...workingCoords.slice(i + 1)
          ];
        } else {
          workingCoords = workingCoords.slice(i);
        }
        break;
      }
    }
    
    if (i >= workingCoords.length - 1) {
      workingCoords = coords.slice(-2);
    } else if (workingCoords.length < 2) {
      workingCoords = coords.slice(0, 2);
    }
    
  } else {
    let i = workingCoords.length - 1;
    while (i > 0) {
      const segment = lineString([workingCoords[i - 1], workingCoords[i]]);
      const segmentLength = length(segment, { units: 'meters' });
      
      if (accumulatedLength + segmentLength < trimDistance) {
        accumulatedLength += segmentLength;
        i--;
      } else {
        const remainingTrim = trimDistance - accumulatedLength;
        
        if (remainingTrim > 0) {
          const keepDistance = segmentLength - remainingTrim;
          const newEndPoint = along(segment, keepDistance, { units: 'meters' });
          workingCoords = [
            ...workingCoords.slice(0, i),
            newEndPoint.geometry.coordinates as Position
          ];
        } else {
          workingCoords = workingCoords.slice(0, i + 1);
        }
        break;
      }
    }
    
    if (i <= 0) {
      workingCoords = coords.slice(0, 2);
    } else if (workingCoords.length < 2) {
      workingCoords = coords.slice(0, 2);
    }
  }

  return {
    type: 'LineString',
    coordinates: workingCoords
  };
};