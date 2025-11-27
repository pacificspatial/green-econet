import express from "express";
import s3Controller from "../controllers/s3Controller.js";

const router = express.Router();

router
  .get("/presigned-url", s3Controller.getPresignedUrlForFile)

export default router;
