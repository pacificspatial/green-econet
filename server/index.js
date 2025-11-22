import http from "http";
import app from "./config/server.js";
import { Server as SocketServer } from "socket.io";
import connectDB from "./db/connect.js";

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: "*", // for testing
    // methods: ["GET", "POST"]
  }
});

async function initApp() {
  try {
    await connectDB();
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log("Econet plateau API listening on port:", port);
    });
  } catch (error) {
    console.log("Failed to start server...", error);
  }
}

initApp();

// Make the socket available to the rest of the app
app.set("socket", io);
