import Anthropic from '@anthropic-ai/sdk';
import { Env } from './types';
import { RateLimiter, RATE_LIMIT_HEADERS } from './rate';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

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
            [RATE_LIMIT_HEADERS.REMAINING]: '0',
            ...(resetTime && { [RATE_LIMIT_HEADERS.RESET]: resetTime.toString() }),
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
            [RATE_LIMIT_HEADERS.REMAINING]: remaining.toString(),
            [RATE_LIMIT_HEADERS.LIMIT]: '10',
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