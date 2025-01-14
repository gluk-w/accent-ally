import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // API routes
  app.post("/api/text", async (req, res) => {
    try {
      const { text, context, language } = req.body;

      // TODO: Replace with actual API call when LocalTone API is available
      // For now, return a mock response
      const mockResponse = {
        new_text: text, // Echo back the text for now
        explanation: "This is a placeholder response until the LocalTone API integration is complete.",
      };

      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "An error occurred" 
      });
    }
  });

  return httpServer;
}