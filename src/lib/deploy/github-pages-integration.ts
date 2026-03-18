// GitHub Pages Integration Module
// Handles automatic deployment to GitHub Pages with git management

export interface GitHubPagesConfig {
  repoOwner: string;
  repoName: string;
  branch?: string; // Default: gh-pages
  customDomain?: string;
  enforceHttps?: boolean;
}

export interface GitHubDeployment {
  id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  url: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
  commitSha?: string;
  commitMessage?: string;
  errorMessage?: string;
}

/**
 * GitHub Pages Integration Engine
 * Handles git operations and automatic deployment to gh-pages
 */
export class GitHubPagesIntegration {
  private apiBaseUrl = 'https://api.github.com';
  private accessToken: string | null = null;
  private config: GitHubPagesConfig | null = null;

  constructor(accessToken?: string, config?: GitHubPagesConfig) {
    this.accessToken = accessToken || null;
    this.config = config || null;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set repository configuration
   */
  setConfig(config: GitHubPagesConfig): void {
    this.config = config;
  }

  /**
   * Create or update a file in the repository
   */
  async createOrUpdateFile(
    filePath: string,
    content: string,
    commitMessage: string,
    branch: string = 'gh-pages'
  ): Promise<{ commit: string; url: string }> {
    if (!this.accessToken || !this.config) {
      throw new Error('GitHub integration not configured');
    }

    // Get current file to obtain its SHA (if it exists)
    let fileSha: string | undefined;
    try {
      const getResponse = await fetch(
        `${this.apiBaseUrl}/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        fileSha = fileData.sha;
      }
    } catch (e) {
      // File doesn't exist yet, which is fine
    }

    // Create or update file
    const response = await fetch(
      `${this.apiBaseUrl}/repos/${this.config.repoOwner}/${this.config.repoName}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(content).toString('base64'),
          branch,
          sha: fileSha,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create/update file: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      commit: data.commit.sha,
      url: data.content.html_url,
    };
  }

  /**
   * Deploy files to GitHub Pages
   */
  async deployFiles(files: Record<string, string>): Promise<GitHubDeployment> {
    if (!this.accessToken || !this.config) {
      throw new Error('GitHub integration not configured');
    }

    const branch = this.config.branch || 'gh-pages';
    const commitMessage = `Deploy: ${new Date().toISOString()}`;
    const deployment: GitHubDeployment = {
      id: `gh-${Date.now()}`,
      status: 'in_progress',
      url: `https://github.com/${this.config.repoOwner}/${this.config.repoName}`,
      previewUrl: `https://${this.config.repoOwner}.github.io/${this.config.repoName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Upload files in parallel
      const uploadPromises = Object.entries(files).map(([path, content]) =>
        this.createOrUpdateFile(path, content, commitMessage, branch).catch((error) => ({
          path,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      );

      const results = await Promise.all(uploadPromises);

      // Check for errors
      const errors = results.filter((r): r is { path: string; error: string } => 'error' in r);
      if (errors.length > 0) {
        deployment.status = 'failed';
        deployment.errorMessage = `Failed to upload ${errors.length} file(s): ${errors.map((e) => e.path).join(', ')}`;
      } else {
        // Get last successful commit SHA
        const lastResult = results[results.length - 1];
        if (lastResult && 'commit' in lastResult) {
          deployment.commitSha = lastResult.commit;
        }
        deployment.status = 'completed';
      }

      deployment.updatedAt = new Date().toISOString();
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.errorMessage = error instanceof Error ? error.message : 'Deployment failed';
      deployment.updatedAt = new Date().toISOString();
      throw deployment;
    }
  }

  /**
   * Enable GitHub Pages for repository
   */
  async enableGitHubPages(): Promise<{ enabled: boolean; url: string }> {
    if (!this.accessToken || !this.config) {
      throw new Error('GitHub integration not configured');
    }

    const branch = this.config.branch || 'gh-pages';

    // GitHub Pages is automatically enabled when content is pushed to gh-pages branch
    // This function validates the repository and returns the expected URL
    const response = await fetch(
      `${this.apiBaseUrl}/repos/${this.config.repoOwner}/${this.config.repoName}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Repository not accessible: ${response.statusText}`);
    }

    const repo = await response.json();

    return {
      enabled: true,
      url: `https://${this.config.repoOwner}.github.io/${this.config.repoName}`,
    };
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<GitHubDeployment | null> {
    // In real implementation, query GitHub API for deployment status
    // For now, return a basic status
    return null;
  }

  /**
   * Configure custom domain
   */
  async setCustomDomain(domain: string): Promise<boolean> {
    if (!this.accessToken || !this.config) {
      throw new Error('GitHub integration not configured');
    }

    // Create/update CNAME file
    try {
      await this.createOrUpdateFile(
        'CNAME',
        domain,
        `Set custom domain: ${domain}`,
        this.config.branch || 'gh-pages'
      );
      return true;
    } catch (error) {
      console.error('Failed to set custom domain:', error);
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<{ name: string; description: string; url: string } | null> {
    if (!this.accessToken || !this.config) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/repos/${this.config.repoOwner}/${this.config.repoName}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const repo = await response.json();
      return {
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      return null;
    }
  }
}

export default GitHubPagesIntegration;
