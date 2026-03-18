import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  isValidTokenValue, 
  exportTokensAsCSS, 
  exportTokensAsJSON,
  type DesignTokenSet,
  type TokenCategory 
} from '@/lib/design-tokens';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, tokens, description, teamId } = body;

    if (!name || !category || !tokens) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, tokens' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['colors', 'typography', 'spacing', 'borders', 'shadows'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate tokens
    for (const [key, token] of Object.entries(tokens)) {
      if (typeof token !== 'object' || !token) {
        return NextResponse.json(
          { error: `Invalid token: ${key}` },
          { status: 400 }
        );
      }
    }

    // Create design tokens record
    const { data: designTokens, error: createError } = await supabase
      .from('design_tokens')
      .insert({
        team_id: teamId || null,
        user_id: user.id,
        name,
        category,
        tokens,
        description,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create design tokens error:', createError);
      return NextResponse.json(
        { error: 'Failed to create design tokens' },
        { status: 500 }
      );
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'design_tokens_created',
      metadata: {
        category,
        token_count: Object.keys(tokens).length,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ designTokens });
  } catch (error) {
    console.error('Design tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as TokenCategory | null;
    const teamId = searchParams.get('teamId');
    const format = searchParams.get('format') || 'json'; // json, css, tailwind

    let query = supabase
      .from('design_tokens')
      .select('*')
      .eq('user_id', user.id);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: designTokens, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch design tokens' },
        { status: 500 }
      );
    }

    // If format is specified, export the first token set
    if (format !== 'json' && designTokens && designTokens.length > 0) {
      const tokenSet = designTokens[0] as any;
      let exportedContent = '';

      if (format === 'css') {
        exportedContent = exportTokensAsCSS(tokenSet);
      } else if (format === 'json') {
        exportedContent = exportTokensAsJSON(tokenSet);
      }

      return NextResponse.json({
        format,
        content: exportedContent,
        filename: `${tokenSet.name.toLowerCase().replace(/\s+/g, '-')}.${format}`,
      });
    }

    return NextResponse.json({ designTokens });
  } catch (error) {
    console.error('Get design tokens error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design tokens' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, tokens, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Design token ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('design_tokens')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update
    const updateData: any = {};
    if (name) updateData.name = name;
    if (tokens) updateData.tokens = tokens;
    if (description !== undefined) updateData.description = description;

    const { data: updated, error: updateError } = await supabase
      .from('design_tokens')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update design tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ designTokens: updated });
  } catch (error) {
    console.error('Update design tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Design token ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('design_tokens')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('design_tokens')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete design tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete design tokens error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
