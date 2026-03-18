import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type ShareRole = 'viewer' | 'editor' | 'admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, sharedWithEmail, role = 'viewer', expiresAt } = body;

    if (!projectId || !sharedWithEmail || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sharedWithEmail, role' },
        { status: 400 }
      );
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be viewer, editor, or admin' },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 403 }
      );
    }

    // Get the user being shared with (if they exist)
    const { data: sharedWithUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', sharedWithEmail)
      .single();

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('project_shares')
      .insert({
        project_id: projectId,
        shared_by_id: user.id,
        shared_with_id: sharedWithUser?.id || null,
        shared_with_email: sharedWithEmail,
        role,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Share error:', shareError);
      return NextResponse.json(
        { error: 'Failed to share project' },
        { status: 500 }
      );
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      project_id: projectId,
      event_type: 'project_shared',
      metadata: {
        role,
        shared_with_email: sharedWithEmail,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      share,
      shareToken: share.share_token,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/shared/${share.share_token}`,
    });
  } catch (error) {
    console.error('Share project error:', error);
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
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter required' },
        { status: 400 }
      );
    }

    // Verify user owns project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Project not found or insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all shares for this project
    const { data: shares, error: sharesError } = await supabase
      .from('project_shares')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (sharesError) {
      return NextResponse.json(
        { error: 'Failed to fetch shares' },
        { status: 500 }
      );
    }

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Get shares error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { shareId, role } = body;

    if (!shareId || !role) {
      return NextResponse.json(
        { error: 'shareId and role required' },
        { status: 400 }
      );
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Verify user owns the project being shared
    const { data: share, error: shareError } = await supabase
      .from('project_shares')
      .select('project_id')
      .eq('id', shareId)
      .single();

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', share.project_id)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update role
    const { data: updated, error: updateError } = await supabase
      .from('project_shares')
      .update({ role })
      .eq('id', shareId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update share' },
        { status: 500 }
      );
    }

    return NextResponse.json({ share: updated });
  } catch (error) {
    console.error('Update share error:', error);
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
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'shareId query parameter required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: share } = await supabase
      .from('project_shares')
      .select('project_id')
      .eq('id', shareId)
      .single();

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', share.project_id)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete share
    const { error: deleteError } = await supabase
      .from('project_shares')
      .delete()
      .eq('id', shareId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete share' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete share error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
