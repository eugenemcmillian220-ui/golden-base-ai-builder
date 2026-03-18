import { NextRequest, NextResponse } from 'next/server';
import GitHubPagesIntegration from '@/lib/deploy/github-pages-integration';
import NetlifyIntegration from '@/lib/deploy/netlify-integration';
import RailwayIntegration from '@/lib/deploy/railway-integration';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { code, name, platform = 'vercel', config = {} } = await request.json();

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and project name are required' },
        { status: 400 }
      );
    }

    const projectName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 48);

    switch (platform) {
      case 'vercel':
        return await deployToVercel(code, projectName);
      case 'github_pages':
        return await deployToGitHubPages(code, projectName, config);
      case 'netlify':
        return await deployToNetlify(code, projectName, config);
      case 'railway':
        return await deployToRailway(code, projectName, config);
      default:
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }
  } catch (error) {
    console.error('Deploy route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deploy' },
      { status: 500 }
    );
  }
}

async function deployToVercel(code: string, projectName: string) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json(
      { error: 'Vercel token not configured. Set VERCEL_TOKEN in environment variables.' },
      { status: 500 }
    );
  }

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `golden-base-${projectName}`,
      public: true,
      files: [
        {
          file: 'index.html',
          data: code,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Vercel API error:', error);
    return NextResponse.json(
      { error: error.error?.message || 'Vercel deployment failed' },
      { status: response.status }
    );
  }

  const deployment = await response.json();
  const url = `https://${deployment.url}`;

  return NextResponse.json({
    success: true,
    url,
    deployment,
  });
}

async function deployToGitHubPages(code: string, projectName: string, config: any) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GitHub token not configured. Set GITHUB_TOKEN in environment variables.' },
      { status: 500 }
    );
  }

  if (!config.repoOwner) {
    return NextResponse.json({ error: 'Repository owner is required for GitHub Pages' }, { status: 400 });
  }

  const github = new GitHubPagesIntegration(GITHUB_TOKEN, {
    repoOwner: config.repoOwner,
    repoName: config.repoName || `golden-base-${projectName}`,
    branch: config.branch || 'gh-pages',
  });

  try {
    const deployment = await github.deployFiles({ 'index.html': code });
    return NextResponse.json({
      success: true,
      url: deployment.previewUrl,
      deployment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.errorMessage || error.message || 'GitHub deployment failed' }, { status: 500 });
  }
}

async function deployToNetlify(code: string, projectName: string, config: any) {
  if (!NETLIFY_TOKEN) {
    return NextResponse.json(
      { error: 'Netlify token not configured. Set NETLIFY_TOKEN in environment variables.' },
      { status: 500 }
    );
  }

  const netlify = new NetlifyIntegration(NETLIFY_TOKEN);
  
  try {
    let siteId = config.siteId;
    if (!siteId) {
      const site = await netlify.createSite(`golden-base-${projectName}-${Math.floor(Math.random() * 1000)}`);
      siteId = site.id;
    }

    const deployment = await netlify.deployFiles(siteId, { 'index.html': code });
    return NextResponse.json({
      success: true,
      url: deployment.deploy_url,
      deployment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Netlify deployment failed' }, { status: 500 });
  }
}

async function deployToRailway(code: string, projectName: string, config: any) {
  if (!RAILWAY_TOKEN) {
    return NextResponse.json(
      { error: 'Railway token not configured. Set RAILWAY_TOKEN in environment variables.' },
      { status: 500 }
    );
  }

  const railway = new RailwayIntegration(RAILWAY_TOKEN);

  try {
    let projectId = config.projectId;
    if (!projectId) {
      const project = await railway.createProject(`golden-base-${projectName}`);
      projectId = project.id;
    }

    const service = await railway.createService(projectId, 'web-app');
    // Note: This is a simplified version. Actual Railway deployment might require more steps.
    return NextResponse.json({
      success: true,
      projectId,
      service,
      message: 'Railway project and service created. See Railway dashboard for deployment progress.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Railway deployment failed' }, { status: 500 });
  }
}
