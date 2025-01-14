import Anthropic from '@anthropic-ai/sdk';
import { Env } from './types';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

      // Access the text content from the first content block
      const content = response.content[0].text;
      const [newText, explanation] = content.split('\n\n');

      return new Response(
        JSON.stringify({
          new_text: newText.trim(),
          explanation: explanation.trim(),
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
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