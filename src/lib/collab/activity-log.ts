// Activity log and audit trail system
// Tracks all changes, comments, and team actions for collaboration and compliance

export interface ActivityEvent {
  id: string;
  projectId: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: 'join' | 'leave' | 'edit' | 'comment' | 'share' | 'export' | 'deploy' | 'delete';
  entityType: 'project' | 'code' | 'comment' | 'share' | 'component';
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface CommentThread {
  id: string;
  projectId: string;
  fileId?: string;
  lineNumber?: number;
  createdBy: string;
  createdByEmail: string;
  createdByName: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  resolved: boolean;
  replies: CommentReply[];
  tags?: string[];
}

export interface CommentReply {
  id: string;
  author: string;
  authorEmail: string;
  authorName: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  mentions?: string[];
}

export interface ChangeSet {
  id: string;
  projectId: string;
  version: number;
  authorId: string;
  authorEmail: string;
  authorName: string;
  description: string;
  changes: CodeChange[];
  timestamp: number;
  files: string[];
}

export interface CodeChange {
  type: 'insert' | 'delete' | 'replace';
  filePath: string;
  position: number;
  oldContent?: string;
  newContent?: string;
  linesBefore: number;
  linesAfter: number;
}

/**
 * Activity Log Engine
 * Tracks all team activities for audit trail and compliance
 */
export class ActivityLogEngine {
  private events: ActivityEvent[] = [];
  private comments: Map<string, CommentThread> = new Map();
  private changeSets: ChangeSet[] = [];
  private maxEvents: number = 10000;
  private onEventCallback?: (event: ActivityEvent) => void;

  constructor(maxEvents?: number) {
    if (maxEvents) {
      this.maxEvents = maxEvents;
    }
  }

  /**
   * Log a new activity event
   */
  logEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent {
    const newEvent: ActivityEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    this.events.push(newEvent);

    // Maintain max size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Trigger callback
    if (this.onEventCallback) {
      this.onEventCallback(newEvent);
    }

    return newEvent;
  }

  /**
   * Log code edit activity
   */
  logCodeEdit(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    filePath: string,
    changes: number,
    description?: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'edit',
      entityType: 'code',
      entityId: filePath,
      description:
        description || `Modified ${filePath} (${changes} changes)`,
      metadata: {
        filePath,
        changeCount: changes,
      },
    });
  }

  /**
   * Log user join
   */
  logUserJoin(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'join',
      entityType: 'project',
      entityId: projectId,
      description: `${userName} joined the project`,
    });
  }

  /**
   * Log user leave
   */
  logUserLeave(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'leave',
      entityType: 'project',
      entityId: projectId,
      description: `${userName} left the project`,
    });
  }

  /**
   * Log share activity
   */
  logShare(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    sharedWith: string,
    role: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'share',
      entityType: 'share',
      entityId: sharedWith,
      description: `${userName} shared project with ${sharedWith} as ${role}`,
      metadata: {
        sharedWith,
        role,
      },
    });
  }

  /**
   * Log deployment
   */
  logDeploy(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    platform: string,
    url?: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'deploy',
      entityType: 'project',
      entityId: projectId,
      description: `${userName} deployed to ${platform}`,
      metadata: {
        platform,
        url,
      },
    });
  }

  /**
   * Log export activity
   */
  logExport(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    format: string
  ): ActivityEvent {
    return this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'export',
      entityType: 'project',
      entityId: projectId,
      description: `${userName} exported project as ${format}`,
      metadata: {
        format,
      },
    });
  }

  /**
   * Get events for a project
   */
  getProjectEvents(
    projectId: string,
    limit: number = 100
  ): ActivityEvent[] {
    return this.events
      .filter((e) => e.projectId === projectId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get events by action type
   */
  getEventsByAction(
    action: ActivityEvent['action'],
    projectId?: string
  ): ActivityEvent[] {
    return this.events.filter(
      (e) =>
        e.action === action &&
        (!projectId || e.projectId === projectId)
    );
  }

  /**
   * Get user activity
   */
  getUserActivity(
    userId: string,
    projectId?: string
  ): ActivityEvent[] {
    return this.events.filter(
      (e) =>
        e.userId === userId &&
        (!projectId || e.projectId === projectId)
    );
  }

  /**
   * Get all events
   */
  getAllEvents(limit: number = 1000): ActivityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Set event callback
   */
  onEvent(callback: (event: ActivityEvent) => void): void {
    this.onEventCallback = callback;
  }

  /**
   * Create a comment thread
   */
  createComment(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string,
    content: string,
    fileId?: string,
    lineNumber?: number,
    tags?: string[]
  ): CommentThread {
    const comment: CommentThread = {
      id: `cmt-${Date.now()}-${Math.random()}`,
      projectId,
      fileId,
      lineNumber,
      createdBy: userId,
      createdByEmail: userEmail,
      createdByName: userName,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      resolved: false,
      replies: [],
      tags,
    };

    this.comments.set(comment.id, comment);

    // Log comment activity
    this.logEvent({
      projectId,
      userId,
      userEmail,
      userName,
      action: 'comment',
      entityType: 'comment',
      entityId: comment.id,
      description: `${userName} commented on ${fileId || 'project'}`,
      metadata: {
        commentId: comment.id,
        lineNumber,
      },
    });

    return comment;
  }

  /**
   * Reply to a comment
   */
  replyToComment(
    commentId: string,
    userId: string,
    userEmail: string,
    userName: string,
    content: string,
    mentions?: string[]
  ): CommentThread | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    const reply: CommentReply = {
      id: `rpl-${Date.now()}-${Math.random()}`,
      author: userId,
      authorEmail: userEmail,
      authorName: userName,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mentions,
    };

    comment.replies.push(reply);
    comment.updatedAt = Date.now();

    return comment;
  }

  /**
   * Resolve a comment thread
   */
  resolveComment(commentId: string): CommentThread | null {
    const comment = this.comments.get(commentId);
    if (!comment) return null;

    comment.resolved = true;
    comment.updatedAt = Date.now();

    return comment;
  }

  /**
   * Get comments for a file
   */
  getFileComments(projectId: string, fileId: string): CommentThread[] {
    return Array.from(this.comments.values()).filter(
      (c) => c.projectId === projectId && c.fileId === fileId
    );
  }

  /**
   * Get all comments for project
   */
  getProjectComments(projectId: string): CommentThread[] {
    return Array.from(this.comments.values()).filter(
      (c) => c.projectId === projectId
    );
  }

  /**
   * Get unresolved comments
   */
  getUnresolvedComments(projectId: string): CommentThread[] {
    return this.getProjectComments(projectId).filter((c) => !c.resolved);
  }

  /**
   * Create a change set (version)
   */
  createChangeSet(
    projectId: string,
    version: number,
    authorId: string,
    authorEmail: string,
    authorName: string,
    description: string,
    changes: CodeChange[],
    files: string[]
  ): ChangeSet {
    const changeSet: ChangeSet = {
      id: `chs-${Date.now()}-${Math.random()}`,
      projectId,
      version,
      authorId,
      authorEmail,
      authorName,
      description,
      changes,
      timestamp: Date.now(),
      files,
    };

    this.changeSets.push(changeSet);

    return changeSet;
  }

  /**
   * Get change sets for project
   */
  getProjectChangesets(projectId: string): ChangeSet[] {
    return this.changeSets.filter((cs) => cs.projectId === projectId);
  }

  /**
   * Get specific version
   */
  getVersion(changeSetId: string): ChangeSet | undefined {
    return this.changeSets.find((cs) => cs.id === changeSetId);
  }

  /**
   * Export activity log
   */
  exportActivityLog(projectId: string): {
    events: ActivityEvent[];
    comments: CommentThread[];
    changesets: ChangeSet[];
  } {
    return {
      events: this.getProjectEvents(projectId, this.maxEvents),
      comments: this.getProjectComments(projectId),
      changesets: this.getProjectChangesets(projectId),
    };
  }

  /**
   * Clear all data
   */
  reset(): void {
    this.events = [];
    this.comments.clear();
    this.changeSets = [];
  }
}

/**
 * Activity log client for frontend
 */
export class ActivityLogClient {
  private engine: ActivityLogEngine;
  private projectId: string;
  private userId: string;
  private userEmail: string;
  private userName: string;

  constructor(
    projectId: string,
    userId: string,
    userEmail: string,
    userName: string
  ) {
    this.projectId = projectId;
    this.userId = userId;
    this.userEmail = userEmail;
    this.userName = userName;
    this.engine = new ActivityLogEngine();
  }

  /**
   * Log code change
   */
  logCodeChange(filePath: string, changes: number): ActivityEvent {
    return this.engine.logCodeEdit(
      this.projectId,
      this.userId,
      this.userEmail,
      this.userName,
      filePath,
      changes
    );
  }

  /**
   * Create comment
   */
  addComment(
    content: string,
    fileId?: string,
    lineNumber?: number
  ): CommentThread {
    return this.engine.createComment(
      this.projectId,
      this.userId,
      this.userEmail,
      this.userName,
      content,
      fileId,
      lineNumber
    );
  }

  /**
   * Reply to comment
   */
  reply(commentId: string, content: string): CommentThread | null {
    return this.engine.replyToComment(
      commentId,
      this.userId,
      this.userEmail,
      this.userName,
      content
    );
  }

  /**
   * Get project activity
   */
  getActivity(limit?: number): ActivityEvent[] {
    return this.engine.getProjectEvents(this.projectId, limit);
  }

  /**
   * Get comments
   */
  getComments(): CommentThread[] {
    return this.engine.getProjectComments(this.projectId);
  }

  /**
   * Get unresolved comments
   */
  getUnresolved(): CommentThread[] {
    return this.engine.getUnresolvedComments(this.projectId);
  }

  /**
   * Listen to activity events
   */
  onActivity(callback: (event: ActivityEvent) => void): void {
    this.engine.onEvent(callback);
  }
}
