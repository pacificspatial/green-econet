import express from "express";
import s3PresignedUrlController from "../controllers/s3PresignedUrlController.js";

const router = express.Router();

router
  .get("/", s3PresignedUrlController.getPresignedUrlForFile)

export default router;
