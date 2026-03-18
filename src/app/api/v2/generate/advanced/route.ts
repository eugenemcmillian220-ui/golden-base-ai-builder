import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSystemPrompt, createEnhancedPrompt, TIER_FEATURES, type Framework, type DesignSystem } from '@/lib/ai-templates';

// Rate limiting per tier
const RATE_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  business: 500,
  enterprise: 5000,
};

async function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  return { apiKey };
}

async function checkRateLimit(userId: string, tier: string): Promise<boolean> {
  // TODO: Implement rate limiting with Supabase
  // For now, return true to proceed
  return true;
}

async function logAnalytics(
  userId: string,
  projectId: string,
  framework: Framework,
  designSystem: DesignSystem
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('analytics_events').insert({
      user_id: userId,
      project_id: projectId,
      event_type: 'generate_advanced',
      metadata: {
        framework,
        design_system: designSystem,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log analytics:', error);
    // Don't fail the request if analytics fails
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user subscription tier
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier || 'free';

    // Parse request body
    const body = await request.json();
    const {
      prompt,
      projectId,
      framework = 'react' as Framework,
      designSystem = 'tailwind' as DesignSystem,
      template,
      includeTypeScript = false,
      refinement = {},
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate framework and design system access
    const tierFeatures = TIER_FEATURES[tier] || TIER_FEATURES.free;
    if (!tierFeatures.frameworks.includes(framework)) {
      return NextResponse.json(
        { error: `Framework ${framework} not available in ${tier} tier` },
        { status: 403 }
      );
    }
    if (!tierFeatures.designSystems.includes(designSystem)) {
      return NextResponse.json(
        { error: `Design system ${designSystem} not available in ${tier} tier` },
        { status: 403 }
      );
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(user.id, tier);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get system and user prompts
    const systemPrompt = getSystemPrompt(framework);
    const enhancedPrompt = createEnhancedPrompt(prompt, framework, designSystem);

    // Call OpenAI API
    const { apiKey } = await getOpenAIClient();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: enhancedPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate code' },
        { status: response.status }
      );
    }

    const result = await response.json();
    const generatedCode = result.choices[0]?.message?.content || '';

    // Log analytics
    if (projectId) {
      await logAnalytics(user.id, projectId, framework, designSystem);
    }

    return NextResponse.json({
      code: generatedCode,
      framework,
      designSystem,
      template,
      includeTypeScript,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Advanced generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
