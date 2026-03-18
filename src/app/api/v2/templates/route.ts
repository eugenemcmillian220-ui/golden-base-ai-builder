import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_TEMPLATES, type TemplateCategory } from '@/lib/ai-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as TemplateCategory | null;

    if (category) {
      const templates = PROMPT_TEMPLATES[category] || [];
      return NextResponse.json({ templates, category });
    }

    // Return all templates grouped by category
    return NextResponse.json({ templates: PROMPT_TEMPLATES });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
