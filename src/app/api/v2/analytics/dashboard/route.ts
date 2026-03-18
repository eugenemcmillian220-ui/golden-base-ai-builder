import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get user's subscription tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier || 'free';

    // Get project statistics
    const { data: projects } = await supabase
      .from('projects')
      .select('id, framework, code, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Get framework usage
    const frameworkStats = projects?.reduce(
      (acc, project) => {
        const framework = project.framework || 'unknown';
        acc[framework] = (acc[framework] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Get generation events
    const { data: generationEvents } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'generate_advanced')
      .gte('created_at', startDate.toISOString());

    // Get project statistics
    const projectCount = projects?.length || 0;
    const avgCodeLength =
      projects && projects.length > 0
        ? projects.reduce((sum, p) => sum + (p.code?.length || 0), 0) /
          projects.length
        : 0;

    // Get feature usage from analytics
    const { data: allEvents } = await supabase
      .from('analytics_events')
      .select('event_type, metadata')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const featureUsage = allEvents?.reduce(
      (acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    // Get API usage stats
    const generationCount = generationEvents?.length || 0;
    const apiCallsToday =
      generationEvents?.filter(
        (e) =>
          new Date(e.created_at).toDateString() ===
          new Date().toDateString()
      ).length || 0;

    // Calculate trends
    const trendStartDate = new Date(startDate);
    trendStartDate.setDate(trendStartDate.getDate() - periodDays);

    const { data: previousPeriodProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', trendStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const projectTrend =
      projectCount > (previousPeriodProjects?.length || 0)
        ? '↑'
        : projectCount < (previousPeriodProjects?.length || 0)
          ? '↓'
          : '→';

    return NextResponse.json({
      period: periodDays,
      tier,
      metrics: {
        projectCount,
        generationCount,
        apiCallsToday,
        avgCodeLength: Math.round(avgCodeLength),
        projectTrend,
      },
      frameworks: frameworkStats,
      features: featureUsage,
      topFeatures: Object.entries(featureUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([feature, count]) => ({ feature, count })),
      generationTrend: generationEvents?.map((event) => ({
        date: new Date(event.created_at).toLocaleDateString(),
        count: 1,
        framework: event.metadata?.framework,
      })) || [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
