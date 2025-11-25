import { pool, sequelize } from "../config/dbConfig.js";
import {
  EnGreen,
  Projects,
  ProjectPolygons,
  ClippedBuffer125Green,
  ClippedGreen
} from "./models/index.js";

export const connectDB = async function () {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    //create tables if not created
    await EnGreen.sync({ alter: true });
    await Projects.sync({ alter: true });
    await ProjectPolygons.sync({ alter: true });
    await ClippedBuffer125Green.sync({ alter: true });
    await ClippedGreen.sync({ alter: true });
  } catch (error) {
    console.error("Unable to connect to the database or sync models:", error);
  }
}

export const db = {
  query: (text, params) => pool.query(text, params),
};
