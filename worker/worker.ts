import Anthropic from '@anthropic-ai/sdk';
import {Env} from './types';
import {RATE_LIMIT_HEADERS, RateLimiter} from './rate';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929';

const rateLimiter = new RateLimiter();

function extractClientIP(request: Request): string {
    return request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        'unknown';
}

function handleCorsPreflightRequest(): Response {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

function validateRequestMethod(request: Request): Response | null {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', {status: 405});
    }
    return null;
}

function checkRateLimit(clientIP: string): Response | null {
    if (rateLimiter.isRateLimited(clientIP)) {
        const resetTime = rateLimiter.getResetTime(clientIP);
        console.warn('Rate limit exceeded for', clientIP, 'until', resetTime);

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
                    ...(resetTime && {[RATE_LIMIT_HEADERS.RESET]: resetTime.toString()}),
                },
            }
        );
    }
    return null;
}

async function parseAndValidateInput(request: Request): Promise<{text: string; context?: string; language: string} | Response> {
    const {text, context, language = 'american'} = await request.json();

    if (!text) {
        return new Response('Text is required', {status: 400});
    }

    if (text.length > 1024 || (context && context.length > 1024)) {
        console.error("Text is too long", text, context);
        return new Response('Text is too long', {status: 400});
    }

    if (language.length > 15) {
        console.error("Language is too long", language);
        return new Response('Language is too long', {status: 400});
    }

    return {text, context, language};
}

function buildPrompts(text: string, context: string | undefined, language: string): {systemPrompt: string; userPrompt: string} {
    const systemPrompt = `You are a writing assistant that helps users adopt a ${language} tone and style.
I will send you a phrase or sentence, and you should slightly improve and correct it so it
sounds more ${language}. Surround the new version by <strong> and </strong> tags.
Include a brief explanation of the changes you made surrounded by <em> and </em> tags.

Example:
Input: I enjoyed participating in the trainings led by HR.
Result: <strong>I enjoyed attending the HR training sessions.</strong>
<em>This version sounds more natural because:

1. "Attending" is more commonly used than "participating in" for training contexts
2. "Training sessions" is more specific and commonly used than just "trainings"
3. Placing "HR" before "training" follows the typical American English pattern of using nouns as adjectives
4. Americans typically don't say "trainings" in plural form - we use "training" or "training sessions"
</em>`;

    const userPrompt = context
        ? `Take into account the context: "${context}"\n\nRewrite this text in a ${language} tone: "${text}"`
        : `Rewrite this text in a ${language} tone: "${text}"`;

    return {systemPrompt, userPrompt};
}

async function callAnthropicAPI(env: Env, systemPrompt: string, userPrompt: string): Promise<string> {
    const anthropic = new Anthropic({
        apiKey: env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        system: systemPrompt,
        max_tokens: 1024,
        messages: [{role: 'user', content: userPrompt}],
    });

    let responseContent = '';
    for (const content of response.content) {
        if (content.type === 'text') {
            responseContent += content.text;
        }
    }

    return responseContent;
}

function validateAnthropicResponse(responseContent: string): Response | null {
    if (responseContent.indexOf('<strong>') === -1) {
        return new Response(
            JSON.stringify({
                error: 'Invalid response from Anthropic',
                message: responseContent,
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
    }
    return null;
}

function parseResponseContent(responseContent: string): {newText: string; explanation: string} {
    const newText = responseContent.split('<strong>')[1].split('</strong>')[0];
    const explanation = (responseContent.indexOf('<em>'))
        ? responseContent.split('<em>')[1].split('</em>')[0]
        : 'No explanation provided';

    return {newText, explanation};
}

function buildSuccessResponse(newText: string, explanation: string, remaining: number): Response {
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
        });
}

function buildErrorResponse(error: unknown): Response {
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

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const clientIP = extractClientIP(request);

        if (request.method === 'OPTIONS') {
            return handleCorsPreflightRequest();
        }

        const methodError = validateRequestMethod(request);
        if (methodError) return methodError;

        const rateLimitError = checkRateLimit(clientIP);
        if (rateLimitError) return rateLimitError;

        try {
            const inputResult = await parseAndValidateInput(request);
            if (inputResult instanceof Response) return inputResult;

            const {text, context, language} = inputResult;

            const {systemPrompt, userPrompt} = buildPrompts(text, context, language);

            const responseContent = await callAnthropicAPI(env, systemPrompt, userPrompt);

            const validationError = validateAnthropicResponse(responseContent);
            if (validationError) return validationError;

            const {newText, explanation} = parseResponseContent(responseContent);

            const remaining = rateLimiter.getRemainingRequests(clientIP);
            console.log("Processed", text, "to", newText, "rate:", remaining);

            return buildSuccessResponse(newText, explanation, remaining);
        } catch (error) {
            return buildErrorResponse(error);
        }
    },
};
