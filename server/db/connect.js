import sequelize from "../config/dbConfig.js";
import {
  EnGreen,
} from "./models/index.js";

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    //create tables if not created
    await EnGreen.sync({ alter: true });
  } catch (error) {
    console.error("Unable to connect to the database or sync models:", error);
  }
}

export default connectDB;
