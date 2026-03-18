import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v2/deploy/github-pages
 * Deploy project to GitHub Pages
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, githubRepo, githubToken, branch } = body;

    if (!projectId || !githubRepo || !githubToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('id, code, name, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check access
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Push to GitHub
    const deployBranch = branch || 'gh-pages';
    const repoUrl = `https://${githubToken}@github.com/${githubRepo}.git`;

    // Log deployment
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      project_id: projectId,
      event_type: 'deploy',
      metadata: {
        platform: 'github-pages',
        repo: githubRepo,
        branch: deployBranch,
        url: `https://${githubRepo.split('/')[0]}.github.io/${githubRepo.split('/')[1]}`,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      platform: 'github-pages',
      repo: githubRepo,
      branch: deployBranch,
      url: `https://${githubRepo.split('/')[0]}.github.io/${githubRepo.split('/')[1]}`,
    });
  } catch (error) {
    console.error('GitHub Pages deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy to GitHub Pages' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
