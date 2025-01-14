import Anthropic from '@anthropic-ai/sdk';
import { Env } from './types';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

// Rate limiting configuration
const RATE_LIMIT = 10; // requests per hour
const HOUR_IN_MS = 60 * 60 * 1000;

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(ip);

    // Clean up expired entries
    if (clientRequests && now > clientRequests.resetTime) {
      this.requests.delete(ip);
    }

    // If no previous requests or expired, create new entry
    if (!this.requests.has(ip)) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + HOUR_IN_MS,
      });
      return false;
    }

    // Check if rate limit exceeded
    const entry = this.requests.get(ip)!;
    if (entry.count >= RATE_LIMIT) {
      return true;
    }

    // Increment request count
    entry.count++;
    return false;
  }

  getRemainingRequests(ip: string): number {
    const entry = this.requests.get(ip);
    if (!entry || Date.now() > entry.resetTime) {
      return RATE_LIMIT;
    }
    return Math.max(0, RATE_LIMIT - entry.count);
  }

  getResetTime(ip: string): number | null {
    const entry = this.requests.get(ip);
    return entry ? entry.resetTime : null;
  }
}

const rateLimiter = new RateLimiter();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Extract client IP from CF headers or fallback to direct IP
    const clientIP = request.headers.get('cf-connecting-ip') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Check rate limit
    if (rateLimiter.isRateLimited(clientIP)) {
      const resetTime = rateLimiter.getResetTime(clientIP);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime,
          message: 'Too many requests. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Remaining': '0',
            ...(resetTime && { 'X-RateLimit-Reset': resetTime.toString() }),
          },
        }
      );
    }

    try {
      const { text, context, language = 'american' } = await request.json();

      if (!text) {
        return new Response('Text is required', { status: 400 });
      }

      const anthropic = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
      });

      // Construct the system prompt based on language preference
      const systemPrompt = `You are a writing assistant that helps users adopt a ${language} tone and style. 
      Your responses should always include two parts:
      1. The rewritten text that matches the requested tone
      2. A brief explanation of the changes made`;

      // Include context in the user prompt if provided
      const userPrompt = context
        ? `Given this context: "${context}"\n\nPlease rewrite this text in a ${language} tone: "${text}"`
        : `Please rewrite this text in a ${language} tone: "${text}"`;

      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        system: systemPrompt,
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Handle different content types from Claude 3.5's response
      let responseContent = '';
      for (const content of response.content) {
        if (content.type === 'text') {
          responseContent += content.text;
        }
      }

      // Split the response into new text and explanation
      const [newText, explanation] = responseContent.split('\n\n');

      const remaining = rateLimiter.getRemainingRequests(clientIP);
      return new Response(
        JSON.stringify({
          new_text: newText.trim(),
          explanation: explanation.trim(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
          },
        }
      );
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};