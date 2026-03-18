// Railway Deployment Integration Module
// Handles deployment of backend and full-stack applications to Railway

export interface RailwayProject {
  id: string;
  name: string;
  teamId: string;
  createdAt: string;
}

export interface RailwayService {
  id: string;
  name: string;
  source: {
    repo?: string;
    branch?: string;
  };
  status: 'deploying' | 'up' | 'crashed' | 'removed' | 'failed';
  deployments: RailwayDeployment[];
}

export interface RailwayDeployment {
  id: string;
  serviceId: string;
  status: 'BUILDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED' | 'CRASHED';
  url?: string;
  createdAt: string;
  updatedAt: string;
  logs?: string;
  environmentVariables: Record<string, string>;
}

export interface RailwayEnvironmentVariable {
  name: string;
  value: string;
  isReference?: boolean;
}

/**
 * Railway Integration Engine
 * Handles project creation, service management, and deployment
 */
export class RailwayIntegration {
  private apiBaseUrl = 'https://api.railway.app/graphql';
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
   * Execute GraphQL query
   */
  private async executeQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
    if (!this.accessToken) {
      throw new Error('No authentication token set');
    }

    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }

    return result.data as T;
  }

  /**
   * Create a new Railway project
   */
  async createProject(projectName: string): Promise<RailwayProject> {
    const query = `
      mutation CreateProject($input: CreateProjectInput!) {
        projectCreate(input: $input) {
          project {
            id
            name
            teamId
            createdAt
          }
        }
      }
    `;

    const result = await this.executeQuery<{
      projectCreate: { project: RailwayProject };
    }>(query, {
      input: { name: projectName },
    });

    return result.projectCreate.project;
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<RailwayProject | null> {
    const query = `
      query GetProject($projectId: String!) {
        project(id: $projectId) {
          id
          name
          teamId
          createdAt
        }
      }
    `;

    try {
      const result = await this.executeQuery<{ project: RailwayProject }>(query, {
        projectId,
      });
      return result.project;
    } catch {
      return null;
    }
  }

  /**
   * Create a service in a project
   */
  async createService(
    projectId: string,
    serviceName: string,
    sourceRepo?: string,
    sourceBranch?: string
  ): Promise<RailwayService> {
    const query = `
      mutation CreateService($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          service {
            id
            name
            source {
              repo
              branch
            }
            status
            deployments {
              id
              status
              createdAt
            }
          }
        }
      }
    `;

    const result = await this.executeQuery<{
      serviceCreate: { service: RailwayService };
    }>(query, {
      input: {
        projectId,
        name: serviceName,
        source: sourceRepo
          ? {
              repo: sourceRepo,
              branch: sourceBranch || 'main',
            }
          : undefined,
      },
    });

    return result.serviceCreate.service;
  }

  /**
   * Deploy a service
   */
  async deployService(
    serviceId: string,
    environmentVariables?: Record<string, string>
  ): Promise<RailwayDeployment> {
    const query = `
      mutation Deploy($input: DeployInput!) {
        deploy(input: $input) {
          deployment {
            id
            serviceId
            status
            url
            createdAt
            updatedAt
            logs
          }
        }
      }
    `;

    const result = await this.executeQuery<{
      deploy: { deployment: RailwayDeployment };
    }>(query, {
      input: {
        serviceId,
        environmentVariables,
      },
    });

    return result.deploy.deployment;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<RailwayDeployment | null> {
    const query = `
      query GetDeployment($deploymentId: String!) {
        deployment(id: $deploymentId) {
          id
          serviceId
          status
          url
          createdAt
          updatedAt
          logs
        }
      }
    `;

    try {
      const result = await this.executeQuery<{ deployment: RailwayDeployment }>(query, {
        deploymentId,
      });
      return result.deployment;
    } catch {
      return null;
    }
  }

  /**
   * Set environment variables for a service
   */
  async setEnvironmentVariables(
    serviceId: string,
    variables: RailwayEnvironmentVariable[]
  ): Promise<boolean> {
    const query = `
      mutation SetVariables($input: SetVariablesInput!) {
        variablesSet(input: $input) {
          success
        }
      }
    `;

    try {
      const result = await this.executeQuery<{ variablesSet: { success: boolean } }>(query, {
        input: {
          serviceId,
          variables,
        },
      });
      return result.variablesSet.success;
    } catch {
      return false;
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(serviceId: string, limit = 100): Promise<string[]> {
    const query = `
      query GetLogs($serviceId: String!, $limit: Int!) {
        logs(serviceId: $serviceId, limit: $limit) {
          lines
        }
      }
    `;

    try {
      const result = await this.executeQuery<{ logs: { lines: string[] } }>(query, {
        serviceId,
        limit,
      });
      return result.logs.lines;
    } catch {
      return [];
    }
  }

  /**
   * Delete a service
   */
  async deleteService(serviceId: string): Promise<boolean> {
    const query = `
      mutation DeleteService($serviceId: String!) {
        serviceDelete(serviceId: $serviceId) {
          success
        }
      }
    `;

    try {
      const result = await this.executeQuery<{ serviceDelete: { success: boolean } }>(query, {
        serviceId,
      });
      return result.serviceDelete.success;
    } catch {
      return false;
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(clientId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read write',
    });
    return `https://railway.app/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ access_token: string; token_type: string }> {
    const response = await fetch('https://railway.app/oauth/token', {
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

    return response.json();
  }
}

export default RailwayIntegration;
