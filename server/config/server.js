import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import projectApiRoutes from "../routes/projectRoutes.js";
import layerApiRoutes from "../routes/layerRoutes.js";
import s3Routes from "../routes/s3Routes.js";
import resultApiRoutes from "../routes/resultRoutes.js";
import dotenv from "dotenv";
dotenv.config();

import errorHandler from "../middlewares/errorHandler.js";
import { authorizer } from "../middlewares/auth.js";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: process.env.FRONT_END_URL,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );
app.use(cors({ origin: "*" }));

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.use(authorizer);

app.use("/api/v1/projects", projectApiRoutes);
app.use("/api/v1/map/layers", layerApiRoutes);
app.use("/api/v1/s3", s3Routes);
app.use("/api/v1/results", resultApiRoutes);

app.use(errorHandler);

export default app;
