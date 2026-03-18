// Netlify Integration Module
// Handles one-click deployment to Netlify with preview URLs and deployment tracking

export interface NetlifyAuthToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  admin_url: string;
  updated_at: string;
  published_deploy?: {
    id: string;
    url: string;
    created_at: string;
    updated_at: string;
  };
}

export interface NetlifyDeployment {
  id: string;
  site_id: string;
  state: 'queued' | 'building' | 'built' | 'error';
  review_url?: string;
  deploy_url?: string;
  screenshot_url?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  error_message?: string;
}

/**
 * Netlify Integration Engine
 * Handles authentication, site creation, and deployment management
 */
export class NetlifyIntegration {
  private apiBaseUrl = 'https://api.netlify.com/api/v1';
  private accessToken: string | null = null;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'deploy',
    });
    return `https://app.netlify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<NetlifyAuthToken> {
    const response = await fetch('https://api.netlify.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code: ${response.statusText}`);
    }

    const data = (await response.json()) as NetlifyAuthToken;
    this.accessToken = data.access_token;
    return data;
  }

  /**
   * Create a new Netlify site
   */
  async createSite(siteName: string): Promise<NetlifySite> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${this.apiBaseUrl}/sites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: siteName }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create site: ${response.statusText}`);
    }

    return (await response.json()) as NetlifySite;
  }

  /**
   * Get site details
   */
  async getSite(siteId: string): Promise<NetlifySite> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${this.apiBaseUrl}/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get site: ${response.statusText}`);
    }

    return (await response.json()) as NetlifySite;
  }

  /**
   * List user's sites
   */
  async listSites(): Promise<NetlifySite[]> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${this.apiBaseUrl}/sites`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list sites: ${response.statusText}`);
    }

    return (await response.json()) as NetlifySite[];
  }

  /**
   * Deploy files to Netlify
   */
  async deployFiles(
    siteId: string,
    files: Record<string, string>
  ): Promise<NetlifyDeployment> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    // Create deployment manifest
    const manifest: Record<string, string> = {};
    for (const [path, content] of Object.entries(files)) {
      // Calculate SHA1 hash of content (simplified)
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      manifest[path] = hashHex;
    }

    // Start deployment
    const deployResponse = await fetch(`${this.apiBaseUrl}/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: manifest }),
    });

    if (!deployResponse.ok) {
      throw new Error(`Failed to start deployment: ${deployResponse.statusText}`);
    }

    const deployment = (await deployResponse.json()) as NetlifyDeployment;

    // Upload files
    for (const [path, content] of Object.entries(files)) {
      const uploadUrl = `${this.apiBaseUrl}/sites/${siteId}/deploys/${deployment.id}/files${path}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      });

      if (!uploadResponse.ok) {
        console.error(`Failed to upload file ${path}: ${uploadResponse.statusText}`);
      }
    }

    return deployment;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(siteId: string, deployId: string): Promise<NetlifyDeployment> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${this.apiBaseUrl}/sites/${siteId}/deploys/${deployId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get deployment status: ${response.statusText}`);
    }

    return (await response.json()) as NetlifyDeployment;
  }

  /**
   * List deployments for a site
   */
  async listDeployments(siteId: string, limit = 10): Promise<NetlifyDeployment[]> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await fetch(`${this.apiBaseUrl}/sites/${siteId}/deploys?${params}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list deployments: ${response.statusText}`);
    }

    return (await response.json()) as NetlifyDeployment[];
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(siteId: string, deployId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(`${this.apiBaseUrl}/sites/${siteId}/deploys/${deployId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete deployment: ${response.statusText}`);
    }
  }

  /**
   * Publish a deployment
   */
  async publishDeployment(siteId: string, deployId: string): Promise<NetlifyDeployment> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(
      `${this.apiBaseUrl}/sites/${siteId}/deploys/${deployId}/publish`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to publish deployment: ${response.statusText}`);
    }

    return (await response.json()) as NetlifyDeployment;
  }
}

export default NetlifyIntegration;
