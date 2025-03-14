// server.d.ts

import { Server } from 'http';

declare global {
  namespace Express {
    interface Application {
      server: Server;
    }
  }
}
