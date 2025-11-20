import * as turf from "@turf/turf";

export const addMidpoints = (
  coordinates: number[][],
  editedIndex: number | null
): number[][] => {
  if (editedIndex === null) return coordinates; // No vertex was edited

  const newCoordinates = [...coordinates]; // Clone array to prevent mutation

  const totalVertices = newCoordinates.length - 1; // Last vertex is same as first (closed polygon)

  // Get indices of the two adjacent vertices
  const prevIndex = editedIndex === 0 ? totalVertices - 1 : editedIndex - 1;
  const nextIndex = (editedIndex + 1) % totalVertices;

  // Compute midpoints for the two adjacent edges
  const midpointPrev = turf.midpoint(
    turf.point(newCoordinates[prevIndex]),
    turf.point(newCoordinates[editedIndex])
  ).geometry.coordinates;

  const midpointNext = turf.midpoint(
    turf.point(newCoordinates[editedIndex]),
    turf.point(newCoordinates[nextIndex])
  ).geometry.coordinates;

  // Insert midpoints into the correct positions in the array
  const updatedCoordinates = [];

  for (let i = 0; i < newCoordinates.length; i++) {
    updatedCoordinates.push(newCoordinates[i]); // Add original vertex

    // Insert midpoints at the correct locations
    if (i === prevIndex) {
      updatedCoordinates.push(midpointPrev);
    }
    if (i === editedIndex) {
      updatedCoordinates.push(midpointNext);
    }
  }

  // Ensure polygon is still closed
  if (
    updatedCoordinates[updatedCoordinates.length - 1] !== updatedCoordinates[0]
  ) {
    updatedCoordinates.push(updatedCoordinates[0]);
  }

  return updatedCoordinates;
};
