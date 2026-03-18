// Role-Based Access Control (RBAC) system
// Manages project permissions and feature access based on user roles

export type UserRole = 'owner' | 'editor' | 'viewer' | 'admin';
export type ProjectPermission = 
  | 'read'
  | 'write'
  | 'delete'
  | 'share'
  | 'deploy'
  | 'settings'
  | 'admin';

export interface RolePermissions {
  [key: string]: ProjectPermission[];
}

/**
 * Permission matrix for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, ProjectPermission[]> = {
  owner: ['read', 'write', 'delete', 'share', 'deploy', 'settings', 'admin'],
  editor: ['read', 'write', 'deploy'],
  viewer: ['read'],
  admin: ['read', 'write', 'delete', 'share', 'deploy', 'settings', 'admin'],
};

/**
 * RBAC Engine for permission management
 */
export class RBACEngine {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(
    userRole: UserRole,
    permission: ProjectPermission
  ): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  }

  /**
   * Check if a user can perform multiple permissions
   */
  static hasAllPermissions(
    userRole: UserRole,
    permissions: ProjectPermission[]
  ): boolean {
    return permissions.every((perm) => this.hasPermission(userRole, perm));
  }

  /**
   * Check if a user can perform any of the permissions
   */
  static hasAnyPermission(
    userRole: UserRole,
    permissions: ProjectPermission[]
  ): boolean {
    return permissions.some((perm) => this.hasPermission(userRole, perm));
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(userRole: UserRole): ProjectPermission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Check if a user can share a project
   */
  static canShare(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'share');
  }

  /**
   * Check if a user can delete a project
   */
  static canDelete(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'delete');
  }

  /**
   * Check if a user can deploy a project
   */
  static canDeploy(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'deploy');
  }

  /**
   * Check if a user can edit a project
   */
  static canEdit(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'write');
  }

  /**
   * Check if a user can change project settings
   */
  static canChangeSettings(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'settings');
  }

  /**
   * Check if a user can manage admins
   */
  static isAdmin(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }
}

/**
 * Team member data structure
 */
export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  joinedAt: Date;
  lastActive: Date;
}

/**
 * Project sharing data structure
 */
export interface ProjectShare {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  role: UserRole;
  sharedBy: string;
  sharedAt: Date;
  permissions: ProjectPermission[];
  expiresAt?: Date;
  isExpired: boolean;
}

/**
 * Team management engine
 */
export class TeamEngine {
  private members: Map<string, TeamMember> = new Map();

  /**
   * Add a team member
   */
  addMember(
    userId: string,
    email: string,
    name: string,
    role: UserRole
  ): TeamMember {
    const member: TeamMember = {
      userId,
      email,
      name,
      role,
      joinedAt: new Date(),
      lastActive: new Date(),
    };

    this.members.set(userId, member);
    return member;
  }

  /**
   * Remove a team member
   */
  removeMember(userId: string): boolean {
    return this.members.delete(userId);
  }

  /**
   * Update a member's role
   */
  updateMemberRole(userId: string, role: UserRole): TeamMember | null {
    const member = this.members.get(userId);
    if (!member) return null;

    member.role = role;
    return member;
  }

  /**
   * Get a team member
   */
  getMember(userId: string): TeamMember | undefined {
    return this.members.get(userId);
  }

  /**
   * Get all team members
   */
  getAllMembers(): TeamMember[] {
    return Array.from(this.members.values());
  }

  /**
   * Get members by role
   */
  getMembersByRole(role: UserRole): TeamMember[] {
    return Array.from(this.members.values()).filter((m) => m.role === role);
  }

  /**
   * Check if user is a member
   */
  isMember(userId: string): boolean {
    return this.members.has(userId);
  }

  /**
   * Get team size
   */
  getTeamSize(): number {
    return this.members.size;
  }

  /**
   * Update last active time
   */
  updateLastActive(userId: string): void {
    const member = this.members.get(userId);
    if (member) {
      member.lastActive = new Date();
    }
  }
}

/**
 * Permission validation utility
 */
export class PermissionValidator {
  /**
   * Validate if user can access resource
   */
  static validateAccess(
    userRole: UserRole,
    requiredPermissions: ProjectPermission[],
    requireAll: boolean = true
  ): boolean {
    if (requireAll) {
      return RBACEngine.hasAllPermissions(userRole, requiredPermissions);
    } else {
      return RBACEngine.hasAnyPermission(userRole, requiredPermissions);
    }
  }

  /**
   * Get accessible features for a role
   */
  static getAccessibleFeatures(userRole: UserRole): string[] {
    const permissions = RBACEngine.getPermissions(userRole);
    const features: string[] = [];

    if (permissions.includes('read')) {
      features.push('view_project', 'view_code', 'view_analytics');
    }
    if (permissions.includes('write')) {
      features.push('edit_code', 'edit_settings', 'create_components');
    }
    if (permissions.includes('delete')) {
      features.push('delete_project', 'delete_files');
    }
    if (permissions.includes('share')) {
      features.push('invite_members', 'change_permissions', 'manage_sharing');
    }
    if (permissions.includes('deploy')) {
      features.push('deploy_project', 'manage_deployments', 'view_deployment_logs');
    }
    if (permissions.includes('settings')) {
      features.push('change_project_settings', 'manage_integrations');
    }
    if (permissions.includes('admin')) {
      features.push(
        'manage_team',
        'manage_billing',
        'audit_logs',
        'manage_sso'
      );
    }

    return features;
  }
}
