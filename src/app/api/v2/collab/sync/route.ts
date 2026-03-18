import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OperationalTransformationEngine, Operation } from '@/lib/collab/operational-transformation';
import { ActivityLogEngine } from '@/lib/collab/activity-log';

// In-memory OT engines per project (in production, use Redis)
const otEngines = new Map<string, OperationalTransformationEngine>();
const activityLogs = new Map<string, ActivityLogEngine>();

function getOTEngine(projectId: string): OperationalTransformationEngine {
  if (!otEngines.has(projectId)) {
    otEngines.set(projectId, new OperationalTransformationEngine());
  }
  return otEngines.get(projectId)!;
}

function getActivityLog(projectId: string): ActivityLogEngine {
  if (!activityLogs.has(projectId)) {
    activityLogs.set(projectId, new ActivityLogEngine());
  }
  return activityLogs.get(projectId)!;
}

/**
 * GET /api/v2/collab/sync
 * Get current document state and operation history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const version = searchParams.get('version');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    // Check project access
    const { data: share } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!share && user.id !== projectId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const otEngine = getOTEngine(projectId);
    const currentVersion = otEngine.getVersion();

    // Get operations since specified version
    const operations = version
      ? otEngine.getOperationsSince(parseInt(version))
      : otEngine.getHistory();

    return NextResponse.json({
      projectId,
      currentVersion,
      operations,
      operationCount: operations.length,
    });
  } catch (error) {
    console.error('Collab sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync collaboration data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/collab/sync
 * Apply a remote operation to the document
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, operation } = body;

    if (!projectId || !operation) {
      return NextResponse.json(
        { error: 'Missing projectId or operation' },
        { status: 400 }
      );
    }

    // Check project access
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if user has edit access
    const { data: share } = await supabase
      .from('project_shares')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    const isOwner = project.user_id === user.id;
    const hasEditAccess = isOwner || share?.role === 'editor';

    if (!hasEditAccess) {
      return NextResponse.json(
        { error: 'No edit access' },
        { status: 403 }
      );
    }

    // Get OT engine and apply operation
    const otEngine = getOTEngine(projectId);
    const transformedOp = otEngine.applyRemoteOperation(operation as Operation);

    // Log activity
    const activityLog = getActivityLog(projectId);
    const opType = (operation as Operation).type;
    activityLog.logCodeEdit(
      projectId,
      user.id,
      user.email || 'unknown',
      user.user_metadata?.full_name || 'Anonymous',
      'editor',
      1,
      `Applied ${opType} operation`
    );

    // Persist to database
    await supabase
      .from('project_versions')
      .insert({
        project_id: projectId,
        version: otEngine.getVersion(),
        user_id: user.id,
        changes: {
          operations: [transformedOp],
          timestamp: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      transformedOp,
      version: otEngine.getVersion(),
    });
  } catch (error) {
    console.error('Collab sync error:', error);
    return NextResponse.json(
      { error: 'Failed to apply operation' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
