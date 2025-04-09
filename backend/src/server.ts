import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './connectDB';
import promptRoutes from './controllers/promptController';
import { wss, broadcastMessage } from './utils/websocket';
import { startProcess } from "./controllers/promptController";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// WebSocket server setup
let isRunning = false;

// ✅ Function to continuously process prompts until stopped
const startLoop = async () => {
  isRunning = true;
  while (isRunning) {
    console.log("Running process...");
    try {
      await startProcess(); // Mock req, res objects for now
    } catch (error) {
      console.error("Error in process loop:", error);
      broadcastMessage("Process encountered an error!");
    }
  }
  broadcastMessage("Process Stopped!");
};

// ✅ Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.on("message", (message) => {
    const msg = message.toString().trim();

    if (msg === "START") {
      if (!isRunning) {
        startLoop();
        broadcastMessage("Process started!");
      }
    } else if (msg === "STOP") {
      isRunning = false;
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Routes
app.use('/api/prompts', promptRoutes);

// export { broadcastMessage }; // Export for use in other parts of your app

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});