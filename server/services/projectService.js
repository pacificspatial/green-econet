import { axiosAPI } from "../utils/axiosAPI.js";
// import { extractTokenFromHeader, decodeToken } from "../middlewares/auth.js";
import CustomError from "../utils/customError.js";

import { smallRegionUsageTypes } from "../constants/projectConstants.js";

import {
  VALID_RAIN_TYPES,
  VALID_SUB_RAIN_TYPES_FOR_7,
} from "../constants/rainType.js";

//sanitize input to prevent SQL injection
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input.replace(/'/g, "\\'").replace(/\n/g, "\\n");
  }
  return input;
};

const getNextProjectId = async () => {
  const maxProjectIdQuery = `
    SELECT COALESCE(MAX(project_id), 0) AS max_id
    FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects;
  `;

  const maxProjectIdResponse = await axiosAPI.post("/query", {
    q: maxProjectIdQuery,
  });

  return maxProjectIdResponse.data.rows[0].max_id + 1;
};

const getNextShapeId = async () => {
  const maxShapeIdQuery = `
    SELECT COALESCE(MAX(shape_id), 0) AS max_id
    FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes;
  `;

  const maxShapeIdResponse = await axiosAPI.post("/query", {
    q: maxShapeIdQuery,
  });

  return maxShapeIdResponse.data.rows[0].max_id + 1;
};

const validateProjectId = async (project_id) => {
  const validateQuery = `
    SELECT COUNT(*) AS count
    FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
    WHERE project_id = ${project_id};
  `;

  const validateResponse = await axiosAPI.post("/query", { q: validateQuery });
  return validateResponse.data.rows[0].count > 0;
};

const validateShapeId = async (shape_id, project_id) => {
  const validateQuery = `
    SELECT COUNT(*) AS count
    FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
    WHERE shape_id = ${shape_id} AND project_id = ${project_id};
  `;

  const validateResponse = await axiosAPI.post("/query", { q: validateQuery });
  return validateResponse.data.rows[0].count > 0;
};

const getPointsCount = async (geoJSONString, isFullGrid = false) => {
  try {
    let countQuery;

    if (isFullGrid) {
      countQuery = `
        SELECT COUNT(*) as count 
        FROM ${process.env.CARTO_TABLE_PREFIX}rg_temp_no_zero_rosenka_hazard WHERE target = 1;
      `;
    } else {
      const escapedGeoJSON = geoJSONString.replace(/'/g, "''");
      countQuery = `
        WITH input_geom AS (
          SELECT ST_GEOGFROMGEOJSON('${escapedGeoJSON}') as geom
        )
        SELECT COUNT(*) as count
        FROM ${process.env.CARTO_TABLE_PREFIX}rg_temp_no_zero_rosenka_hazard AS grid, input_geom
        WHERE ST_INTERSECTS(grid.geom, input_geom.geom) AND grid.target = 1;
      `;
    }

    const countResponse = await axiosAPI.post("/query", { q: countQuery });
    return countResponse.data.rows[0].count;
  } catch (error) {
    console.error("Error counting points:", error);
    throw new Error(`Failed to count points: ${error.message}`);
  }
};

const createProject = async (req, res, next) => {
  // const token = extractTokenFromHeader(req);
  // const decodedToken = decodeToken(token);
  // const userId = decodedToken?.payload?.username;
  // const socket = req.app.get("socket");

  const { name, description, note, usage_type } = req.body;

  try {
    // Detect if version 2 table (has usage_type column)
    const isV2 =
      String(process.env.CARTO_TABLE_VERSION_PREFIX).split("_")[0] === "rg2";

    // Normalize project name by trimming spaces and converting to lowercase
    const normalizedName = name.replace(/\s+/g, "").toLowerCase();

    // Check for duplicate project name with normalized name
    const checkDuplicateQuery = `
      SELECT COUNT(*) AS count
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE REPLACE(LOWER(name), ' ', '') = '${normalizedName.replace("'", "''")}';
    `;

    const duplicateCheckResponse = await axiosAPI.post("/query", {
      q: checkDuplicateQuery,
    });

    if (duplicateCheckResponse.data.rows[0].count > 0) {
      console.warn("Duplicate project detected");
      throw new CustomError(
        "Project name already exists",
        409,
        "EXISTING_PROJECT"
      );
    }

    const project_id = await getNextProjectId();

    // Get the current timestamp for date_created and date_modified
    const currentTimestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);
    //avoid rejecting multiline input.
    const sanitizeName = sanitizeInput(name);
    const sanitizeDesc = sanitizeInput(description);
    const sanitizeNote = sanitizeInput(note);
    const sanitizeUsageType = sanitizeInput(usage_type);

    // Dynamic columns & values (depends on version)
    const columns = [
      "name",
      "description",
      "note",
      "user_id",
      "date_created",
      "date_modified",
      "project_id",
      "aoi_type",
      ...(isV2 ? ["usage_type"] : []),
    ];

    const values = [
      `'${sanitizeName}'`,
      `'${sanitizeDesc || ""}'`,
      `'${sanitizeNote || ""}'`,
      `'${userId}'`,
      `'${currentTimestamp}'`,
      `'${currentTimestamp}'`,
      `${project_id}`,
      1,
      ...(isV2 ? [`'${sanitizeUsageType || ""}'`] : []),
    ];

    // Prepare and execute the insert query
    const insertQuery = `
      INSERT INTO ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      (${columns.join(", ")})
      VALUES (${values.join(", ")});
    `;

    await axiosAPI.post("/query", { q: insertQuery });

    const selectFields = [
      "project_id",
      "name",
      "description",
      "note",
      "user_id",
      "date_created",
      "date_modified",
      "aoi_type",
      "geom",
      ...(isV2 ? ["usage_type"] : []),
    ];

    const fetchCreatedProjectQuery = `
      SELECT ${selectFields.join(", ")}
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE project_id = ${project_id};
    `;

    const fetchCreatedProjectResponse = await axiosAPI.post("/query", {
      q: fetchCreatedProjectQuery,
    });

    const createdProject = fetchCreatedProjectResponse.data.rows[0];
    //socket event to get the new project to all other users
    socket.emit("newProject", {
      newProject: createdProject,
      clientId: req.body.clientId,
    });

    // Respond with the new project details
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: createdProject,
    });
  } catch (err) {
    console.error("Error creating project:", err);
    throw err;
  }
};

const listProjects = async (req) => {
  try {
    // const token = extractTokenFromHeader(req);
    // const decodedToken = decodeToken(token);
    // const userId = decodedToken?.payload?.username;
    if (!userId) {
      throw new Error("User ID (username) not found in token");
    }

    const CARTO_TABLE_VERSION_PREFIX =
      process.env.CARTO_TABLE_VERSION_PREFIX || "rg_cm_";
    const isV2 = String(CARTO_TABLE_VERSION_PREFIX).split("_")[0] === "rg2";

    const fields = [
      "name",
      "description",
      "note",
      "date_created",
      "date_modified",
      "project_id",
      "aoi_type",
      ...(isV2 ? ["usage_type"] : []),
    ];

    // Fetching all projects from the specified table
    const query = `
      SELECT 
        ${fields.join(", ")}          
      FROM ${process.env.CARTO_TABLE_PREFIX}${CARTO_TABLE_VERSION_PREFIX}projects
      ${where}
      ORDER BY date_created DESC, name ASC
    `;

    const cacheBuster = new Date().getTime();
    const config = {
      headers: { "Cache-Control": "no-cache" },
      params: { q: query, cache: cacheBuster },
    };

    const response = await axiosAPI.get("/query", config);
    return { success: true, data: response?.data?.rows };
  } catch (err) {
    console.log("error fetching projects:", err);
    throw err;
  }
};

const updateProject = async (project_id, projectData) => {
  try {
    const { name, description, note } = projectData;
    if (name) {
      // Normalize project name by trimming spaces and converting to lowercase
      const normalizedName = name.replace(/\s+/g, "").toLowerCase();

      // Check for duplicate project name with normalized name
      const checkDuplicateQuery = `
        SELECT COUNT(*) AS count
        FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
        WHERE REPLACE(LOWER(name), ' ', '') = '${normalizedName.replace(
          "'",
          "''"
        )}'
        AND project_id != ${project_id};
      `;

      const duplicateCheckResponse = await axiosAPI.post("/query", {
        q: checkDuplicateQuery,
      });

      if (duplicateCheckResponse.data.rows[0].count > 0) {
        console.warn("Duplicate project detected");
        throw new CustomError(
          "Project name already exists",
          409,
          "EXISTING_PROJECT"
        );
      }
    }
    // Get the current timestamp for date_modified
    const currentTimestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19);

    // Construct the SQL update statement with only provided fields
    let updates = [];
    const sanitizeName = sanitizeInput(name);
    const sanitizeDesc = sanitizeInput(description);
    const sanitizeNote = sanitizeInput(note);

    if (name) updates.push(`name = '${sanitizeName}'`);
    if (description !== undefined)
      updates.push(`description = '${sanitizeDesc ? sanitizeDesc : ""}'`);
    if (note !== undefined)
      updates.push(`note = '${sanitizeNote ? sanitizeNote : ""}'`);

    // Always update the date_modified field
    updates.push(`date_modified = '${currentTimestamp}'`);

    if (updates.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const updateQuery = `
      UPDATE ${
        process.env.CARTO_TABLE_PREFIX
      }${process.env.CARTO_TABLE_VERSION_PREFIX}projects SET ${updates.join(
        ", "
      )} WHERE project_id = ${project_id};
    `;

    await axiosAPI.post("/query", { q: updateQuery });

    // Retrieve and return the updated project
    const retrieveQuery = `SELECT name, description ,note, date_created, date_modified, project_id, aoi_type, geom FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects where project_id=${project_id}`;

    const responseData = await axiosAPI.post("/query", { q: retrieveQuery });

    return { success: true, data: responseData.data.rows[0] };
  } catch (err) {
    console.error("Error updating project:", err.message);
    throw err;
  }
};

const deleteProject = async (project_id, clientId, socket) => {
  try {
    // Prepare the DELETE SQL statement with a query to delete from both tables
    const deleteQuery = `
      BEGIN;
      
      -- Delete shapes associated with the project
      DELETE FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      WHERE project_id = ${project_id};

      -- Delete the project itself
      DELETE FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE project_id = ${project_id};
      
      COMMIT;
    `;

    // Execute the DELETE query
    await axiosAPI.post("/query", { q: deleteQuery });

    //socket event to delete the project from other users list
    socket.emit("deleteProject", { projectId: project_id, clientId: clientId });

    return {
      success: true,
      message: "Project and its associated shapes successfully deleted",
    };
  } catch (err) {
    console.error("Error deleting project:", err.message);
    throw err;
  }
};

// Function to add an AOI to a project
const addAoi = async (project_id, aoiShape) => {
  try {
    const { geom, aoi_type, region_id } = aoiShape;

    if (!project_id || !aoi_type) {
      return { success: false, message: "Missing required parameters" };
    }

    if (aoi_type > 2 || aoi_type < 1) {
      return { success: false, message: "Invalid aoi type" };
    }

    // 🔹 Step 1: Fetch usage_type for the project
    const usageQuery = `
      SELECT usage_type
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE project_id = ${project_id};
    `;
    const usageResponse = await axiosAPI.post("/query", { q: usageQuery });
    const usage_type = usageResponse.data?.rows?.[0]?.usage_type;

    const geoJSONString = JSON.stringify(geom);
    let updateQuery;

    if (aoi_type == 1 && usage_type === "road_planning") {
      // Clip road polygons within AOI
      const snapQuery = `
        WITH roads_near_boundary AS (
          -- Get roads that are near the AOI boundary (within a small buffer)
          SELECT r.geom
          FROM ${process.env.CARTO_TABLE_PREFIX}rg_road_polygon r
          WHERE ST_DWITHIN(r.geom, ST_GEOGFROMGEOJSON('${geoJSONString}'), 5) -- 5 meter tolerance
        ),
        merged_nearby_roads AS (
          -- Merge nearby roads
          SELECT ST_UNION_AGG(geom) as merged_roads
          FROM roads_near_boundary
        ),
        aoi_with_road_buffer AS (
          -- Buffer the AOI slightly and intersect with merged roads
          SELECT ST_INTERSECTION(
            ST_BUFFER(ST_GEOGFROMGEOJSON('${geoJSONString}'), 2), -- 2 meter buffer
            merged_roads
          ) as snapped_geom
          FROM merged_nearby_roads
        )
        SELECT ST_ASGEOJSON(snapped_geom) AS merged_geom_json
        FROM aoi_with_road_buffer
        WHERE NOT ST_ISEMPTY(snapped_geom);
      `;

      const snapResponse = await axiosAPI.post("/query", { q: snapQuery });
      const mergedGeomJSON = snapResponse.data?.rows?.[0]?.merged_geom_json;

      if (!mergedGeomJSON) {
        return {
          success: false,
          message: "No clipped polygons found within AOI.",
        };
      }

      // Update project polygon_geom and geom using the snapped geometry
      updateQuery = `
        UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
        SET 
            polygon_geom = ST_GEOGFROMGEOJSON('${mergedGeomJSON}'),
            geom = CASE 
                WHEN (aoi_type  = 1) THEN ST_GEOGFROMGEOJSON('${mergedGeomJSON}')
                ELSE geom
            END,
            date_modified = CURRENT_TIMESTAMP
        WHERE project_id = ${project_id};
      `;
    }

    // Regular AOI save (non-road_planning)
    else if (aoi_type == 1) {
      updateQuery = `
        UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
        SET 
          polygon_geom = ST_GEOGFROMGEOJSON('${geoJSONString}'),
          geom = CASE 
            WHEN (aoi_type  = 1) THEN ST_GEOGFROMGEOJSON('${geoJSONString}')
            ELSE geom
          END,
          date_modified = CURRENT_TIMESTAMP
        WHERE project_id = ${project_id};
      `;
    } else if (aoi_type == 2) {
      const appendUsageTypes = smallRegionUsageTypes;
      if (appendUsageTypes.includes(usage_type)) {
        // Append to arrays
        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET 
            region_geom = ARRAY_CONCAT(COALESCE(region_geom, []), [ST_GEOGFROMGEOJSON('${geoJSONString}')]),
            region_id = ARRAY_CONCAT(COALESCE(region_id, []), [${region_id}]),
            geom = CASE 
              WHEN (aoi_type = 2) THEN (
                SELECT ST_UNION_AGG(g)
                FROM UNNEST(ARRAY_CONCAT(COALESCE(region_geom, []), [ST_GEOGFROMGEOJSON('${geoJSONString}')])) AS g
              )
              ELSE geom
            END,
            date_modified = CURRENT_TIMESTAMP
          WHERE project_id = ${project_id};
        `;
      } else {
        // Replace: keep only the new value in the array
        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET 
            region_geom = [ST_GEOGFROMGEOJSON('${geoJSONString}')],
            geom = CASE 
              WHEN (aoi_type = 2) THEN ST_GEOGFROMGEOJSON('${geoJSONString}')
              ELSE geom
            END,
            region_id = [${region_id}],
            date_modified = CURRENT_TIMESTAMP
          WHERE project_id = ${project_id};
        `;
      }
    }

    if (!updateQuery) {
      return { success: false, message: "Invalid operation" };
    }

    const response = await axiosAPI.post("/query", { q: updateQuery });
    if (response.status === 200) {
      const aoiTypeNames = { 1: "polygon", 2: "region" };
      return {
        success: true,
        message: `AOI of type ${aoiTypeNames[aoi_type]} added successfully${
          usage_type === "road_planning" ? " (snapped to road polygons)" : ""
        }`,
      };
    }

    return { success: false, message: "Failed to update AOI" };
  } catch (error) {
    throw error;
  }
};

// Save AOI route
const saveAoi = async (project_id, aoiShape) => {
  try {
    const { aoi_type, usage_type } = aoiShape;

    if (!project_id || !aoi_type) {
      return { success: false, message: "Missing required parameters" };
    }

    if (aoi_type > 2 || aoi_type < 1) {
      return { success: false, message: "Invalid aoi type" };
    }

    let updateQuery;

    // 🟩 AOI Type 1 — Polygon AOI
    if (aoi_type == 1) {
      updateQuery = `
        UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
        SET 
          geom = CASE 
            WHEN polygon_geom IS NULL THEN NULL
            ELSE polygon_geom 
          END,
          aoi_type = CASE 
            WHEN polygon_geom IS NULL THEN 1
            ELSE ${aoi_type} 
          END,
          date_modified = CURRENT_TIMESTAMP
        WHERE project_id = ${project_id};
      `;
    }

    // 🟦 AOI Type 2 — Region AOI
    else if (aoi_type == 2) {
      if (smallRegionUsageTypes.includes(usage_type)) {
        // Multiple region AOI (union all regions)
        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET 
            geom = CASE 
              WHEN region_geom IS NULL OR ARRAY_LENGTH(region_geom) = 0 THEN NULL
              ELSE (
                SELECT ST_UNION_AGG(g)
                FROM UNNEST(region_geom) AS g
              )
            END,
            aoi_type = ${aoi_type},
            date_modified = CURRENT_TIMESTAMP
          WHERE project_id = ${project_id};
        `;
      } else {
        // Single region AOI — take the first element of array
        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET 
            geom = CASE 
              WHEN region_geom IS NULL OR ARRAY_LENGTH(region_geom) = 0 THEN NULL
              ELSE region_geom[SAFE_OFFSET(0)]
            END,
            aoi_type = CASE 
                WHEN region_geom IS NULL OR ARRAY_LENGTH(region_geom) = 0 THEN 1 
                ELSE ${aoi_type}
            END,
            date_modified = CURRENT_TIMESTAMP
          WHERE project_id = ${project_id};
        `;
      }
    }
    // Run the queries
    const selectQuery = `
      SELECT aoi_type FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects 
      WHERE project_id=${project_id}
    `;

    const updateResponse = await axiosAPI.post("/query", { q: updateQuery });
    const selectResponse = await axiosAPI.post("/query", { q: selectQuery });

    if (updateResponse.status === 200 && selectResponse.status === 200) {
      return {
        success: true,
        message: `Aoi of type ${selectResponse.data.rows[0].aoi_type} saved successfully`,
      };
    }

    return { success: false, message: "Failed to save AOI" };
  } catch (error) {
    throw error;
  }
};

//return type specific aoi's
const getAoi = async (project_id, aoi_type, usageType) => {
  try {
    let retrieveQuery;

    if (aoi_type == 1) {
      // Polygon AOI
      retrieveQuery = `
        SELECT polygon_geom AS geom FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects 
        WHERE project_id=${project_id}
      `;
    } else if (aoi_type == 2) {
      // Region AOI
      if (smallRegionUsageTypes.includes(usageType)) {
        // Multiple regions
        retrieveQuery = `
          SELECT 
            ARRAY(
              SELECT ST_ASGEOJSON(g)
              FROM UNNEST(region_geom) AS g
            ) AS geom,
            region_id
          FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          WHERE project_id = ${project_id};
        `;
      } else {
        // Single region (first element of array)
        retrieveQuery = `
          SELECT 
            ST_ASGEOJSON(region_geom[SAFE_OFFSET(0)]) AS geom,
            region_id[SAFE_OFFSET(0)] AS region_id
          FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          WHERE project_id = ${project_id};
        `;
      }
    } else {
      return { success: false, message: "Invalid AOI type" };
    }

    // Execute query
    const responseData = await axiosAPI.post("/query", { q: retrieveQuery });
    let result = responseData.data.rows;

    // Post-process for multiple-region usage types
    if (aoi_type == 2) {
      if (smallRegionUsageTypes.includes(usageType)) {
        result = responseData.data.rows.flatMap((row) => {
          const geomArray = (row.geom || [])
            .map((g) => {
              try {
                return JSON.parse(g);
              } catch {
                console.warn("Invalid GeoJSON:", g);
                return null;
              }
            })
            .filter(Boolean);

          const ids = row.region_id || [];

          // Pair each geometry with its region_id
          return geomArray.map((geom, i) => ({
            geom,
            id: ids[i] ?? ids[0] ?? null,
          }));
        });
      } else {
        // Single region result normalization
        if (result?.[0]) {
          result = [
            {
              geom: JSON.parse(result[0].geom),
              region_id: result[0].region_id,
            },
          ];
        } else {
          result = [];
        }
      }
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("Error in fetching aoi:", err);
    throw err;
  }
};

const getSavedAoi = async (project_id) => {
  try {
    // Fetch the required fields to determine the saved AOI
    const fetchProjectQuery = `
      SELECT aoi_type, usage_type, geom
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE project_id = ${project_id};
    `;

    const projectResponse = await axiosAPI.post("/query", {
      q: fetchProjectQuery,
      params: { project_id },
    });

    if (
      projectResponse.status !== 200 ||
      projectResponse.data.rows.length === 0
    ) {
      return { success: false, message: "Project not found or no saved AOI" };
    }

    const { aoi_type, usage_type } = projectResponse.data.rows[0];

    // Modified query to include JOIN with rg_admin_shochiiki when aoi_type is 2
    const retrieveQuery =
      aoi_type === 2 && !smallRegionUsageTypes.includes(usage_type)
        ? `
          SELECT 
            p.aoi_type,
            p.geom,
            p.region_id[SAFE_OFFSET(0)] AS region_id,
            r.s_name
          FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects p
          LEFT JOIN ${process.env.CARTO_TABLE_PREFIX}rg_admin_shochiiki r
            ON p.region_id[SAFE_OFFSET(0)] = r.key_code
          WHERE p.project_id = ${project_id};
        `
        : `
            SELECT 
              aoi_type,
              geom
            FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
            WHERE project_id = ${project_id};
          `;

    const responseData = await axiosAPI.post("/query", {
      q: retrieveQuery,
      params: { project_id },
    });

    return { success: true, data: responseData.data.rows };
  } catch (err) {
    console.error("Error retrieving saved AOI:", err.message);
    throw err;
  }
};

//Remove polygon type AOI
const removeAoi = async (project_id, currentAoiType, regionIdToRemove) => {
  try {
    const getProjectQuery = `
      SELECT aoi_type, usage_type, geom
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
      WHERE project_id = ${project_id};
    `;

    const projectResponse = await axiosAPI.post("/query", {
      q: getProjectQuery,
    });

    if (
      projectResponse.status !== 200 ||
      projectResponse.data.rows.length === 0
    ) {
      return { success: false, message: "Project not found" };
    }

    const project = projectResponse.data.rows[0];
    const { aoi_type, usage_type, geom } = project;

    let updateQuery = "";
    let message = "";

    // === AOI Type 1 ===
    if (currentAoiType === 1) {
      const updateFields = ["polygon_geom = NULL"];
      if (aoi_type === currentAoiType && geom !== null)
        updateFields.push("geom = NULL");
      updateFields.push("date_modified = CURRENT_TIMESTAMP");

      updateQuery = `
        UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
        SET ${updateFields.join(", ")}
        WHERE project_id = ${project_id};
      `;
      message = "Polygon AOI removed successfully";
    }

    // === AOI Type 2 ===
    else if (currentAoiType === 2) {
      // 🟦 If it's a small region usage type (multi-region AOI)
      if (smallRegionUsageTypes.includes(usage_type)) {
        if (!regionIdToRemove) {
          return {
            success: false,
            message: "regionIdToRemove required for small region AOI",
          };
        }

        // Remove specific region ID and geom from arrays
        const updateFields = [
          `region_id = ARRAY(
            SELECT id FROM UNNEST(region_id) AS id
            WHERE id != ${regionIdToRemove}
          )`,
          `region_geom = ARRAY(
            SELECT g FROM UNNEST(region_geom) AS g
            WITH OFFSET off
            WHERE off IN (
              SELECT off FROM UNNEST(region_id) AS id WITH OFFSET off
              WHERE id != ${regionIdToRemove}
            )
          )`,
        ];

        // Recalculate geom if AOI type matches
        if (aoi_type === currentAoiType && geom !== null) {
          updateFields.push(`
            geom = CASE 
              WHEN region_geom IS NULL OR ARRAY_LENGTH(region_geom) = 0 THEN NULL
              ELSE (
                SELECT ST_UNION_AGG(g)
                FROM UNNEST(region_geom) AS g
              )
            END
          `);
        }

        updateFields.push("date_modified = CURRENT_TIMESTAMP");

        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET ${updateFields.join(", ")}
          WHERE project_id = ${project_id};
        `;
        message = `Region ID ${regionIdToRemove} removed successfully from project`;
      } else {
        // 🟩 If it's a single-region AOI (non-smallRegion type)
        const updateFields = ["region_id = NULL", "region_geom = NULL"];
        if (aoi_type === currentAoiType && geom !== null)
          updateFields.push("geom = NULL");
        updateFields.push("date_modified = CURRENT_TIMESTAMP");

        updateQuery = `
          UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects
          SET ${updateFields.join(", ")}
          WHERE project_id = ${project_id};
        `;
        message = "Region AOI removed successfully";
      }
    }

    // === Execute update ===
    if (!updateQuery) return { success: false, message: "Unhandled AOI type" };

    const updateResponse = await axiosAPI.post("/query", { q: updateQuery });

    return updateResponse.status === 200
      ? { success: true, message }
      : { success: false, message: "Failed to remove AOI" };
  } catch (error) {
    console.error("Error removing AOI:", error.message);
    throw error;
  }
};

//shapes api section
const addShape = async (project_id, shape) => {
  try {
    // Validate project ID
    const isValidProject = await validateProjectId(project_id);
    if (!isValidProject) {
      return { success: false, message: "Invalid project ID" };
    }

    // Get the next shape_id
    const shape_id = await getNextShapeId();

    // Extract shape data
    const { geom, rain_type, sub_rain_type } = shape;

    if (!geom || !VALID_RAIN_TYPES.includes(rain_type)) {
      return { success: false, message: "Missing or invalid shape data" };
    }

    if (
      rain_type === 7 &&
      !VALID_SUB_RAIN_TYPES_FOR_7.includes(sub_rain_type)
    ) {
      return {
        success: false,
        message: "Missing or invalid sub_rain_type for rain_type",
      };
    }

    const geoJSONString = JSON.stringify(geom);
    const rainCount = await getPointsCount(geoJSONString);
    const subRainTypeValue =
      sub_rain_type === null || sub_rain_type === undefined
        ? "NULL"
        : sub_rain_type;

    // Construct the insert query with the calculated rain_count
    const insertQuery = `
      INSERT INTO ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      (geom, project_id, shape_id, rain_type, simulation_type, rain_count, sub_rain_type)
      VALUES (
        ST_GEOGFROMGEOJSON('${geoJSONString}'), 
        ${project_id}, 
        ${shape_id}, 
        ${rain_type}, 
        0, 
        ${rainCount},
        ${subRainTypeValue}
      );
    `;

    // Insert the shape into the database
    const insertResponse = await axiosAPI.post("/query", { q: insertQuery });

    if (insertResponse.status === 200) {
      // Fetch the inserted shape data to return in the response
      const selectQuery = `
        SELECT shape_id, geom, rain_type, rain_count 
        FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
        WHERE shape_id = ${shape_id}
      `;
      const selectResponse = await axiosAPI.post("/query", { q: selectQuery });

      if (selectResponse.status === 200 && selectResponse.data.rows) {
        return {
          success: true,
          message: "Shape added successfully",
          data: selectResponse.data.rows[0],
        };
      } else {
        return {
          success: false,
          message: "Failed to retrieve inserted shape data",
        };
      }
    } else {
      return { success: false, message: "Failed to add shape" };
    }
  } catch (error) {
    console.error("Error adding shape:", error);
    return {
      success: false,
      message: "Error processing shape",
      error: error.message || "Unknown error",
    };
  }
};

const getShapes = async (project_id) => {
  try {
    if (!project_id) {
      return { success: false, message: "Project ID is required" };
    }

    const isValidProject = await validateProjectId(project_id);
    if (!isValidProject) {
      return { success: false, message: "Invalid project ID" };
    }

    const retrieveQuery = `
      SELECT shape_id, geom, rain_type, simulation_type 
      FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      WHERE project_id = ${project_id} AND simulation_type = 0;
    `;

    const response = await axiosAPI.post("/query", { q: retrieveQuery });

    if (response.status === 200) {
      return {
        success: true,
        message: "Shapes retrieved successfully",
        data: response.data.rows,
      };
    }

    return { success: false, message: "Failed to fetch shapes" };
  } catch (error) {
    console.error("Error getting shapes:", error.message);
    throw error;
  }
};

const updateShape = async (project_id, shape_id, geom) => {
  try {
    // Validate project ID
    const isValidProject = await validateProjectId(project_id);
    if (!isValidProject) {
      return { success: false, message: "Invalid project ID" };
    }

    // Validate shape ID
    const isValidShape = await validateShapeId(shape_id, project_id);
    if (!isValidShape) {
      return { success: false, message: "Invalid shape ID" };
    }

    if (!geom) {
      return { success: false, message: "Missing geometry data" };
    }

    const geoJSONString = JSON.stringify(geom);
    const rainCount = await getPointsCount(geoJSONString);

    // Update both the geometry and rain_count
    const updateQuery = `
      UPDATE ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      SET 
        geom = ST_GEOGFROMGEOJSON('${geoJSONString}'),
        rain_count = ${rainCount}
      WHERE project_id = ${project_id} AND shape_id = ${shape_id};
    `;

    const updateResponse = await axiosAPI.post("/query", { q: updateQuery });

    if (updateResponse.status !== 200) {
      return { success: false, message: "Failed to update shape" };
    }

    // Fetch the updated shape
    const fetchQuery = `
      SELECT * FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      WHERE project_id = ${project_id} AND shape_id = ${shape_id};
    `;

    const fetchResponse = await axiosAPI.post("/query", { q: fetchQuery });

    if (fetchResponse.status !== 200 || !fetchResponse.data.rows.length) {
      return {
        success: false,
        message: "Shape updated but failed to fetch updated data",
      };
    }

    return {
      success: true,
      message: "Shape and rain count updated successfully",
      data: fetchResponse.data.rows[0],
    };
  } catch (error) {
    console.error("Error updating shape:", error);
    return {
      success: false,
      message: "Error updating shape",
      error: error.message || "Unknown error",
    };
  }
};

const deleteShape = async (project_id, shape_id) => {
  try {
    const deleteQuery = `
      DELETE FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
      WHERE project_id = ${project_id} AND shape_id = ${shape_id};
    `;

    const deleteResponse = await axiosAPI.post("/query", { q: deleteQuery });

    return deleteResponse.status === 200
      ? { success: true, message: "Shape deleted successfully" }
      : { success: false, message: "Failed to delete shape" };
  } catch (error) {
    console.error("Error deleting shape:", error.message);
    throw error;
  }
};

const getLocationArea = async (project_id) => {
  try {
    if (!project_id) {
      return { success: false, message: "Project ID is required" };
    }

    const isValidProject = await validateProjectId(project_id);
    if (!isValidProject) {
      return { success: false, message: "Invalid project ID" };
    }

    // Query to check if the project has an AOI
    const checkAoiQuery = `
      SELECT geom FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects 
      WHERE project_id = ${project_id} AND geom IS NOT NULL;
    `;

    const aoiResponse = await axiosAPI.post("/query", { q: checkAoiQuery });

    let retrieveLocationCountQuery;

    if (aoiResponse.status === 200 && aoiResponse.data.rows.length > 0) {
      // AOI exists, filter by spatial relationships
      retrieveLocationCountQuery = `
        WITH aoi AS (
          SELECT geom FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects WHERE project_id = ${project_id}
        ),
        project_shapes AS (
          SELECT project_id, rain_type, geom, ST_GeometryType(geom) as geom_type
          FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
          WHERE project_id = ${project_id} AND simulation_type = 0
        )
        SELECT 
          ps.rain_type,
          SUM(CASE 
              -- Type A, B, C: Polygon/Line (Line length * 1.2, Polygon uses actual area)
              WHEN ps.rain_type IN (1, 2, 3) THEN
                CASE 
                  WHEN ps.geom_type = 'ST_LineString' OR ps.geom_type = 'ST_MultiLineString' THEN
                    CASE
                      WHEN ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_LENGTH(ps.geom) * 1.2
                      WHEN ST_INTERSECTS(ps.geom, aoi.geom) AND NOT ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_LENGTH(ST_INTERSECTION(ps.geom, aoi.geom)) * 1.2
                      ELSE 0
                    END
                  WHEN ps.geom_type IN ('ST_Polygon', 'ST_MultiPolygon') THEN
                    CASE
                      WHEN ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_AREA(ps.geom)
                      WHEN ST_INTERSECTS(ps.geom, aoi.geom) AND NOT ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_AREA(ST_INTERSECTION(ps.geom, aoi.geom))
                      ELSE 0
                    END
                  ELSE 0
                END
              -- Type D: Polygon only (use actual area)
              WHEN ps.rain_type = 4 THEN
                CASE
                  WHEN ps.geom_type IN ('ST_Polygon', 'ST_MultiPolygon') THEN
                    CASE
                      WHEN ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_AREA(ps.geom)
                      WHEN ST_INTERSECTS(ps.geom, aoi.geom) AND NOT ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_AREA(ST_INTERSECTION(ps.geom, aoi.geom))
                      ELSE 0
                    END
                  ELSE 0
                END
              -- Type E, F: Point (use count, return 1 per point within AOI)
              WHEN ps.rain_type IN (5, 6) THEN
                CASE 
                  WHEN ps.geom_type = 'ST_Point' THEN
                    CASE 
                      WHEN ST_WITHIN(ps.geom, aoi.geom) THEN 1
                      ELSE 0
                    END
                  ELSE 0
                END
              -- Type G: Line (use length instead of area)
              WHEN ps.rain_type = 7 THEN
                CASE
                  WHEN ps.geom_type = 'ST_LineString' OR ps.geom_type = 'ST_MultiLineString' THEN
                    CASE
                      WHEN ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_LENGTH(ps.geom)
                      WHEN ST_INTERSECTS(ps.geom, aoi.geom) AND NOT ST_WITHIN(ps.geom, aoi.geom) THEN 
                        ST_LENGTH(ST_INTERSECTION(ps.geom, aoi.geom))
                      ELSE 0
                    END
                  ELSE 0 
                END
              ELSE 0 
            END) AS total_area
        FROM project_shapes ps, aoi
        GROUP BY ps.rain_type
        ORDER BY ps.rain_type;
      `;
    } else {
      // No AOI, calculate area directly from the shapes
      retrieveLocationCountQuery = `
        WITH project_shapes AS (
          SELECT project_id, rain_type, geom, ST_GeometryType(geom) as geom_type
          FROM ${process.env.CARTO_TABLE_PREFIX}${process.env.CARTO_TABLE_VERSION_PREFIX}projects_shapes
          WHERE project_id = ${project_id} AND simulation_type = 0
        )
        SELECT 
          rain_type,
          SUM(
            CASE 
              -- Type A, B, C: Polygon/Line (Line length * 1.2, Polygon uses actual area)
              WHEN rain_type IN (1, 2, 3) THEN
                CASE 
                  WHEN geom_type = 'ST_LineString' OR geom_type = 'ST_MultiLineString' THEN
                    ST_LENGTH(geom) * 1.2
                  WHEN geom_type IN ('ST_Polygon', 'ST_MultiPolygon') THEN
                    ST_AREA(geom)
                  ELSE 0
                END
              -- Type D: Polygon only (use actual area)
              WHEN rain_type = 4 THEN
                CASE
                  WHEN geom_type IN ('ST_Polygon', 'ST_MultiPolygon') THEN ST_AREA(geom)
                  ELSE 0
                END
              -- Type E, F: Point (use count, return 1 per point)
              WHEN rain_type IN (5, 6) THEN
                CASE 
                  WHEN geom_type = 'ST_Point' THEN 1
                  ELSE 0
                END
              -- Type G: Line (use length)
              WHEN rain_type = 7 THEN
                CASE
                  WHEN geom_type = 'ST_LineString' OR geom_type = 'ST_MultiLineString' THEN
                    ST_LENGTH(geom)
                  ELSE 0
                END
              ELSE 0
            END
          ) AS total_area
        FROM project_shapes
        GROUP BY rain_type
        ORDER BY rain_type;
      `;
    }

    const response = await axiosAPI.post("/query", {
      q: retrieveLocationCountQuery,
    });

    if (response.status === 200) {
      return {
        success: true,
        message: "Area by rain type calculated successfully",
        data: response.data.rows,
      };
    }

    return { success: false, message: "Failed to calculate area by rain type" };
  } catch (error) {
    console.error("Error calculating area by rain type:", error.error);
    throw error;
  }
};

export default {
  createProject,
  updateProject,
  listProjects,
  deleteProject,
  addAoi,
  saveAoi,
  getAoi,
  getSavedAoi,
  removeAoi,
  addShape,
  getShapes,
  updateShape,
  deleteShape,
  getLocationArea,
};
