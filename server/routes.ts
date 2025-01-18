import { Router } from 'express';
import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";

export function registerRoutes(app: Express): Server {
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Text processing endpoint
  app.post('/api/process', async (req, res) => {
    try {
      const { text, context, language } = req.body;

      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }

      // For now, just echo back the text
      // TODO: Implement actual text processing
      res.json({ 
        original_text: text,
        processed_text: text,
        context,
        language
      });
    } catch (error) {
      console.error('Error processing text:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}