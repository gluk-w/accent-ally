import type { Express } from "express";
import { createServer, type Server } from "http";

export function registerRoutes(app: Express): Server {
  // Text processing endpoint
  app.post("/api/process", async (req, res) => {
    try {
      const { text, language } = req.body;
      const apiKey = req.headers.authorization?.split(' ')[1];

      if (!text || typeof text !== "string") {
        return res.status(400).json({ message: "Text is required" });
      }

      if (!language || !["american", "australian", "british", "canadian"].includes(language)) {
        return res.status(400).json({ message: "Invalid language selection" });
      }

      // Here you can use the apiKey and language preference for processing
      // For now, we'll just echo back a success response with the settings
      res.json({ 
        success: true,
        message: "Text processed successfully",
        length: text.length,
        language,
        hasApiKey: !!apiKey
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