import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // API routes
  app.post('/api/text-process', (req, res) => {
    try {
      // This endpoint currently just acknowledges the request
      // as the actual processing happens in the frontend
      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Text processing error:', error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to process text'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}