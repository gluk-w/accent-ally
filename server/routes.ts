import type { Express } from "express";
import { createServer, type Server } from "http";
import { RateLimiter, RATE_LIMIT_HEADERS } from "./rate";
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
const rateLimiter = new RateLimiter();

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  app.post("/api/process-text", async (req, res) => {
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

    if (rateLimiter.isRateLimited(clientIP)) {
      const resetTime = rateLimiter.getResetTime(clientIP);
      return res.status(429).json({
        error: "Rate limit exceeded",
        resetTime,
        message: "Too many requests. Please try again later.",
      });
    }

    try {
      const { text, context, language = 'american' } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      const systemPrompt = `You are a writing assistant that helps users adopt a ${language} tone and style. 
      Your responses should always include two parts:
      1. The rewritten text that matches the requested tone
      2. A brief explanation of the changes made`;

      const userPrompt = context
        ? `Given this context: "${context}"\n\nPlease rewrite this text in a ${language} tone: "${text}"`
        : `Please rewrite this text in a ${language} tone: "${text}"`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        system: systemPrompt,
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let responseContent = '';
      for (const content of response.content) {
        if (content.type === 'text') {
          responseContent += content.text;
        }
      }

      const [newText, explanation] = responseContent.split('\n\n');
      const remaining = rateLimiter.getRemainingRequests(clientIP);

      res.set({
        [RATE_LIMIT_HEADERS.REMAINING]: remaining.toString(),
        [RATE_LIMIT_HEADERS.LIMIT]: '10',
      }).json({
        new_text: newText.trim(),
        explanation: explanation.trim(),
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  });

  return httpServer;
}
