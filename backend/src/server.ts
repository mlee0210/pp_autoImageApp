// src/server.ts
import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import connectDB from "./connectDB";
import { promptRoutes } from './controllers/promptController';
// import DiscordBot from './services/discordBot';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Start the Discord Bot
// const discordBot = new DiscordBot(); // Initialize the bot to start it

// Routes
app.use('/api/prompts', promptRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import connectDB from './connectDB';
// import { promptRoutes } from './controllers/promptController';
// import WebSocket from 'ws';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// connectDB();

// // WebSocket server setup
// const wss = new WebSocket.Server({ noServer: true });

// // Broadcast a message to all connected WebSocket clients
// function broadcastMessage(message: string) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(message);
//     }
//   });
// }

// // Handling WebSocket connections
// wss.on('connection', (ws) => {
//   console.log('Client connected');
//   ws.on('message', (message) => {
//     console.log('Received message:', message);
//   });
//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });

// // Integrate WebSocket with the Express server
// const server = app.listen(process.env.PORT || 5001, () => {
//   console.log(`Server running on port ${process.env.PORT || 5001}`);
// });

// // WebSocket server handles upgrade requests from the HTTP server
// server.on('upgrade', (request, socket, head) => {
//   wss.handleUpgrade(request, socket, head, (ws) => {
//     wss.emit('connection', ws, request);
//   });
// });

// // Routes
// app.use('/api/prompts', promptRoutes);

// export { broadcastMessage }; // Export for use in other parts of your app
