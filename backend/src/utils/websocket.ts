import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 }); // Adjust port if needed

export const broadcastMessage = (message: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
};

export { wss };
