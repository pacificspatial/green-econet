import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to .env located in /server/.env or /var/www/stg/.env
dotenv.config({
  path: path.resolve(__dirname, "./.env")
});
