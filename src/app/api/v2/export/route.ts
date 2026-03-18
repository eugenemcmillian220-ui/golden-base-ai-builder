import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExportEngine, type ExportFormat } from '@/lib/export';

/**
 * POST /api/v2/export
 * Export project to selected format
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, format, componentName } = body;

    if (!projectId || !format) {
      return NextResponse.json(
        { error: 'Missing projectId or format' },
        { status: 400 }
      );
    }

    // Get project code
    const { data: project } = await supabase
      .from('projects')
      .select('id, code, user_id')
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
      const { data: share } = await supabase
        .from('project_shares')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (!share) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Export to selected format
    let exportResult;
    
    switch (format as ExportFormat) {
      case 'react-jsx':
        exportResult = ExportEngine.exportToReactJSX(project.code, componentName);
        break;
      case 'react-tsx':
        exportResult = ExportEngine.exportToReactTSX(project.code, componentName);
        break;
      case 'vue3':
        exportResult = ExportEngine.exportToVue3(project.code, componentName);
        break;
      case 'svelte':
        exportResult = ExportEngine.exportToSvelte(project.code, componentName);
        break;
      case 'vanilla-js':
        exportResult = ExportEngine.exportToVanillaJS(project.code, componentName);
        break;
      case 'vanilla-html':
        exportResult = ExportEngine.exportToVanillaHTML(project.code);
        break;
      case 'next-pages':
        exportResult = ExportEngine.exportToNextPages(project.code);
        break;
      case 'next-app':
        exportResult = ExportEngine.exportToNextApp(project.code);
        break;
      case 'astro':
        exportResult = ExportEngine.exportToAstro(project.code, componentName);
        break;
      case 'html-css-js':
        exportResult = ExportEngine.exportToVanillaHTML(project.code);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    // Log export activity
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      project_id: projectId,
      event_type: 'export',
      metadata: {
        format,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      format,
      files: exportResult.files,
      packageJson: exportResult.packageJson,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export project' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
