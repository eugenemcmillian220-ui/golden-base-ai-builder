import { NextRequest, NextResponse } from 'next/server';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!VERCEL_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel token not configured. Set VERCEL_TOKEN in environment variables.' },
        { status: 500 }
      );
    }

    const { code, name } = await request.json();

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and project name are required' },
        { status: 400 }
      );
    }

    // Create a deployment on Vercel
    const projectName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 48);

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
        { error: error.error?.message || 'Deployment failed' },
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
  } catch (error) {
    console.error('Deploy route error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy' },
      { status: 500 }
    );
  }
}
