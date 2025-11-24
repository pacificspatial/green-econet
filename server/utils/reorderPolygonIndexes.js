import { Op } from "sequelize";
import { ProjectPolygons } from "../db/models/index.js";

/**
 * Reorder polygon indexes after a polygon is deleted.
 * Polygons with a higher index than the deleted one are decremented by 1.
 *
 * @param {string} projectId - The ID of the project
 * @param {number} deletedIndex - The index of the polygon that was deleted
 */
export const reorderPolygonIndexes = async (projectId, deletedIndex) => {
  try {
    // Get polygons with index greater than the deleted one
    const polygonsToUpdate = await ProjectPolygons.findAll({
      where: {
        project_id: projectId,
        polygon_index: {
          [Op.gt]: deletedIndex,
        },
      },
      order: [["polygon_index", "ASC"]],
    });

    // Decrement each polygon's index
    for (const polygon of polygonsToUpdate) {
      polygon.polygon_index = polygon.polygon_index - 1;
      await polygon.save();
    }
  } catch (error) {
    console.error("Error reordering polygon indexes:", error.message);
    throw error;
  }
};
