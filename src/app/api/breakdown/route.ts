import { NextRequest, NextResponse } from 'next/server';
import { BreakdownResponseSchema } from '@/lib/schemas';
import { getUniversalTemplateSteps } from '@/lib/utils';

// Lazy load OpenAI to avoid issues during build
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  import('openai').then((module) => {
    const OpenAI = module.default;
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  });
}

// Rate limiting (simple in-memory store for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { taskTitle } = body;

    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json(
        { error: 'Invalid task title' },
        { status: 400 }
      );
    }

    // Validate task title (profanity/unsafe filter - basic)
    const unsafePatterns = [
      /violence/i,
      /harm/i,
      /illegal/i,
      // Add more patterns as needed
    ];

    if (unsafePatterns.some((pattern) => pattern.test(taskTitle))) {
      return NextResponse.json(
        { error: 'Task title contains inappropriate content' },
        { status: 400 }
      );
    }

    // If no API key, use fallback
    if (!process.env.OPENAI_API_KEY || !openai) {
      const fallbackSteps = getUniversalTemplateSteps(taskTitle);
      return NextResponse.json({
        steps: fallbackSteps,
        fallback: true,
      });
    }

    try {
      // Dynamically import OpenAI if not already loaded
      if (!openai) {
        const OpenAI = (await import('openai')).default;
        openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that breaks down tasks into 3-5 micro-steps. Each step should be:
- Very small and actionable (≤2 minutes each)
- Clear and specific
- Encouraging and supportive
- Focused on getting started, not perfection

Return only a JSON array of steps with this exact structure:
{
  "steps": [
    {"text": "step description", "duration_min": 1 or 2},
    ...
  ]
}

Keep steps to 1-2 minutes maximum. Use simple, calm language.`,
          },
          {
            role: 'user',
            content: `Break down this task into 3-5 micro-steps (1-2 minutes each): "${taskTitle}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      const validated = BreakdownResponseSchema.parse(parsed);

      // Ensure durations are 1 or 2
      const validatedSteps = validated.steps.map((step) => ({
        text: step.text,
        duration_min: step.duration_min === 1 || step.duration_min === 2 ? step.duration_min : 2,
      }));

      return NextResponse.json({
        steps: validatedSteps,
        fallback: false,
      });
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to template
      const fallbackSteps = getUniversalTemplateSteps(taskTitle);
      return NextResponse.json({
        steps: fallbackSteps,
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Breakdown API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

