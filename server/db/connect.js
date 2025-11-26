import { pool, sequelize } from "../config/dbConfig.js";
import {
  Projects,
  ProjectPolygons,
  ClippedBuffer125Green,
  ClippedGreen
} from "./models/index.js";

export const connectDB = async function () {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database or sync models:", error);
  }
}

export const db = {
  query: (text, params) => pool.query(text, params),
};
