import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // Register API routes
  app.post('/api/text-process', (req, res) => {
    // This is a mock response since we're using the external API
    // The actual processing happens in the frontend
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);
  return httpServer;
}