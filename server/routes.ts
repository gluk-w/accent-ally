import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // Text processing endpoint
  app.post("/api/process", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }

      // Here you can add any text processing logic
      // For now, we'll just echo back a success response
      res.json({ 
        success: true,
        message: "Text processed successfully",
        length: text.length
      });
      
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to process text",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
