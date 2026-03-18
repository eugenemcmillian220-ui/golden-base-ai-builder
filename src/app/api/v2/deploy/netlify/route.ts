// Netlify Deployment API Route
// Handles one-click deployment to Netlify with OAuth flow and deployment tracking

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DeployRequest {
  projectId: string;
  siteName: string;
  files: Record<string, string>;
  action: 'authorize' | 'deploy' | 'status' | 'list';
  deploymentId?: string;
  authCode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeployRequest = await request.json();
    const { action, projectId, siteName, files, deploymentId, authCode } = body;

    // Validate project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'authorize': {
        // Return OAuth authorization URL
        const clientId = process.env.NETLIFY_CLIENT_ID;
        if (!clientId) {
          return NextResponse.json(
            { error: 'Netlify client ID not configured' },
            { status: 500 }
          );
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v2/deploy/netlify/callback`;
        const authUrl = `https://app.netlify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=deploy`;

        return NextResponse.json({ authUrl });
      }

      case 'deploy': {
        // Deploy files to Netlify
        const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
        if (!accessToken) {
          return NextResponse.json(
            { error: 'Netlify access token not configured' },
            { status: 500 }
          );
        }

        // Create or update site
        let site;
        const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: siteName }),
        });

        if (siteResponse.ok) {
          site = await siteResponse.json();
        } else {
          throw new Error('Failed to create Netlify site');
        }

        // Create deployment
        const deployResponse = await fetch(
          `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files }),
          }
        );

        if (!deployResponse.ok) {
          throw new Error('Failed to create deployment');
        }

        const deployment = await deployResponse.json();

        // Save deployment info to database
        await supabase.from('deployments').insert({
          project_id: projectId,
          platform: 'netlify',
          site_id: site.id,
          deployment_id: deployment.id,
          status: 'deploying',
          url: site.url,
          preview_url: deployment.deploy_url,
          metadata: { siteName, filesCount: Object.keys(files).length },
        });

        // Log analytics event
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'deployment',
          platform: 'netlify',
          metadata: { projectId, siteId: site.id, fileCount: Object.keys(files).length },
        });

        return NextResponse.json({
          success: true,
          site: {
            id: site.id,
            name: site.name,
            url: site.url,
          },
          deployment: {
            id: deployment.id,
            status: deployment.state,
            previewUrl: deployment.deploy_url,
          },
        });
      }

      case 'status': {
        // Get deployment status
        if (!deploymentId) {
          return NextResponse.json(
            { error: 'Deployment ID required' },
            { status: 400 }
          );
        }

        const { data: deployment, error: deployError } = await supabase
          .from('deployments')
          .select('*')
          .eq('id', deploymentId)
          .eq('project_id', projectId)
          .single();

        if (deployError || !deployment) {
          return NextResponse.json(
            { error: 'Deployment not found' },
            { status: 404 }
          );
        }

        // Fetch latest status from Netlify
        const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
        if (accessToken) {
          const statusResponse = await fetch(
            `https://api.netlify.com/api/v1/sites/${deployment.site_id}/deploys/${deployment.deployment_id}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (statusResponse.ok) {
            const latestStatus = await statusResponse.json();

            // Update database if status changed
            if (latestStatus.state !== deployment.status) {
              await supabase
                .from('deployments')
                .update({ status: latestStatus.state })
                .eq('id', deploymentId);
            }

            return NextResponse.json({
              deployment: {
                id: deployment.id,
                status: latestStatus.state,
                url: deployment.url,
                previewUrl: latestStatus.deploy_url,
                publishedAt: latestStatus.published_at,
                error: latestStatus.error_message,
              },
            });
          }
        }

        return NextResponse.json({ deployment });
      }

      case 'list': {
        // List deployments for project
        const { data: deployments, error: deployError } = await supabase
          .from('deployments')
          .select('*')
          .eq('project_id', projectId)
          .eq('platform', 'netlify')
          .order('created_at', { ascending: false })
          .limit(10);

        if (deployError) {
          throw new Error('Failed to fetch deployments');
        }

        return NextResponse.json({ deployments });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Netlify deployment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deployment failed' },
      { status: 500 }
    );
  }
}

// Netlify OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code not provided' },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NETLIFY_CLIENT_ID,
        client_secret: process.env.NETLIFY_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const token = await tokenResponse.json();

    // Store token securely (in production, use encrypted storage)
    // For now, return to frontend to store in session
    return NextResponse.json({
      success: true,
      token: token.access_token,
      redirectUrl: '/dashboard/deployments?connected=netlify',
    });
  } catch (error) {
    console.error('Netlify OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    );
  }
}
