import express from "express";
import layerController from "../controllers/layerController.js";

const router = express.Router();

router
  .get("/green", layerController.getGreenLayer)
  .get("/buffer_green", layerController.getBuffer125GreenLayer);

export default router;
