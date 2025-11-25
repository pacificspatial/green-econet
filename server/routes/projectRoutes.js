import express from "express";
import projectController from "../controllers/projectController.js";
import projectValidationRules from "../validators/projectValidator.js";
import validate from "../validators/validator.js";

const router = express.Router();

// Project routes
router
  .post("/",
    validate(projectValidationRules.createProject),
    projectController.createProject
  )
  .patch("/:projectId",
    validate(projectValidationRules.updateProject),
    projectController.updateProject
  )
  .delete("/:projectId", projectController.deleteProject)
  .get("/", projectController.getAllProjects)
  .get("/:projectId", projectController.getProject);

// Project Polygon routes
router
  .post("/polygon", projectController.createProjectPolygon)
  .patch("/polygon/:polygonId", projectController.updateProjectPolygon)
  .delete("/polygon/:polygonId", projectController.deleteProjectPolygon)
  .get("/:projectId/polygon", projectController.getPolygonsByProject);

// Set AOI for a project
router
  .post("/:project_id/process/run", projectController.setProjectAoi);
  
export default router;
