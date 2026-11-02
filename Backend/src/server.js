import "./config/env.js";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initializeSocket(httpServer);

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`CraftMIgo API listening on port ${PORT}`);
  });
};

startServer().catch(() => {
  console.error("CraftMIgo API startup failed. Check the database configuration.");
  process.exitCode = 1;
  httpServer.close();
});
