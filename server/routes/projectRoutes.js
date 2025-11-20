import express from "express";
import projectController from "../controllers/projectController.js";
import projectValidationRules from "../validators/projectValidator.js";
import validate from "../validators/validator.js";

const router = express.Router();

router
  .route("/projects")
  .get(projectController.listProjects)
  .post(
    validate(projectValidationRules.createProject),
    projectController.createProject
  );

router
  .route("/projects/:project_id")
  .put(
    validate(projectValidationRules.updateProject),
    projectController.updateProject
  )
  .delete(projectController.deleteProject);

router.route("/projects/:project_id/aoi").put(projectController.removeAoi);

router.route("/projects/:project_id/aoi/draft").put(projectController.addAoi);

router.route("/projects/:project_id/aoi/save").put(projectController.saveAoi);

router.route("/projects/:project_id/aoi/:aoi_type").get(projectController.getAoi);

router.route("/projects/:project_id/saved-aoi").get(projectController.getSavedAoi);

// Shapes related routes
router
  .route("/projects/:project_id/shapes")
  .post(projectController.addShape)
  .get(projectController.getShapes);

router
  .route("/projects/:project_id/shapes/:shape_id")
  .put(projectController.updateShape)
  .delete(projectController.deleteShape);

router
  .route("/projects/:project_id/location-area")
  .get(projectController.getLocationArea);

export default router;
