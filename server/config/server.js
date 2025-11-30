import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import projectApiRoutes from "../routes/projectRoutes.js";
import layerApiRoutes from "../routes/layerRoutes.js";
import s3Routes from "../routes/s3Routes.js";
import resultApiRoutes from "../routes/resultRoutes.js";

import errorHandler from "../middlewares/errorHandler.js";
import { authorizer } from "../middlewares/auth.js";

const app = express();

/* -----------------------------------------
   GLOBAL CORS (for ALL routes)
------------------------------------------- */
const allowedOrigins = [
  "https://stg.econet-plateau.net",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// VERY IMPORTANT — allow preflight
app.options("*", cors());

/* -----------------------------------------
   OPTIONS Preflight Handler (CRITICAL)
------------------------------------------- */
// app.use((req, res, next) => {
//   if (req.method === "OPTIONS") {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
//     return res.sendStatus(204);
//   }
//   next();
// });

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
// app.use(cors({ origin: "*" }));

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
