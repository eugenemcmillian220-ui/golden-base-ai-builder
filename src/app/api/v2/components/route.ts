import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, framework, designSystem, tags = [], propsSchema, documentation, teamId } = body;

    if (!name || !code || !framework) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, framework' },
        { status: 400 }
      );
    }

    // Create component
    const { data: component, error: createError } = await supabase
      .from('components')
      .insert({
        team_id: teamId || null,
        created_by_id: user.id,
        name,
        code,
        framework,
        design_system: designSystem || null,
        tags: tags.length > 0 ? tags : null,
        props_schema: propsSchema || null,
        documentation: documentation || null,
        version: '1.0.0',
      })
      .select()
      .single();

    if (createError) {
      console.error('Create component error:', createError);
      return NextResponse.json(
        { error: 'Failed to create component' },
        { status: 500 }
      );
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'component_created',
      metadata: {
        framework,
        tags: tags.length,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ component });
  } catch (error) {
    console.error('Component creation error:', error);
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
    const search = searchParams.get('search');
    const framework = searchParams.get('framework');
    const tag = searchParams.get('tag');
    const teamId = searchParams.get('teamId');

    let query = supabase
      .from('components')
      .select('*')
      .eq('created_by_id', user.id);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (framework) {
      query = query.eq('framework', framework);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,documentation.ilike.%${search}%`);
    }

    const { data: components, error: fetchError } = await query.order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch components' },
        { status: 500 }
      );
    }

    return NextResponse.json({ components });
  } catch (error) {
    console.error('Get components error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch components' },
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
    const { id, code, tags, documentation, version } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Component ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('components')
      .select('created_by_id')
      .eq('id', id)
      .single();

    if (!existing || existing.created_by_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update component
    const updateData: any = {};
    if (code) updateData.code = code;
    if (tags) updateData.tags = tags;
    if (documentation !== undefined) updateData.documentation = documentation;
    if (version) updateData.version = version;

    const { data: updated, error: updateError } = await supabase
      .from('components')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update component' },
        { status: 500 }
      );
    }

    return NextResponse.json({ component: updated });
  } catch (error) {
    console.error('Update component error:', error);
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
        { error: 'Component ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('components')
      .select('created_by_id')
      .eq('id', id)
      .single();

    if (!existing || existing.created_by_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete component
    const { error: deleteError } = await supabase
      .from('components')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete component' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete component error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
