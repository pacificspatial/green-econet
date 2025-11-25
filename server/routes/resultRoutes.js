import express from "express";
import resultController from "../controllers/resultController.js";

const router = express.Router();

router
  .get("/clipped-buffer125-green/:projectId", resultController.getClippedBuffer125GreenResult)
  .get("/clipped-green/:projectId", resultController.getClippedGreenResult)

export default router;
