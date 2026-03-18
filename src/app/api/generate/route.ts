import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting by IP (or user ID if available)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success, limit, remaining, resetAt } = await rateLimit(ip, 10, 60000);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetAt.toString(),
          }
        }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Call OpenAI API to generate code
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert web developer. Generate clean, well-structured HTML, CSS, and JavaScript code.
            
Rules:
- Return ONLY valid HTML code (no explanations or markdown)
- Include all CSS in <style> tags
- Include all JavaScript in <script> tags
- Make the code responsive and modern
- Use best practices for performance and accessibility
- The code should be ready to run in a browser immediately
- Make it visually appealing with good UX/UI
- Include animations and smooth transitions where appropriate`,
          },
          {
            role: 'user',
            content: `Create a web app with the following requirements: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Failed to generate code' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const code = data.choices[0]?.message?.content || '';

    if (!code) {
      return NextResponse.json(
        { error: 'No code generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Generate route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
