// Real-time collaboration WebSocket server setup
// This uses Socket.io for robust WebSocket communication with fallbacks

import { Server as HTTPServer } from 'http';
import { Socket as ClientSocket, Server as SocketIOServer } from 'socket.io';

export interface CollaborativeUser {
  id: string;
  email: string;
  name: string;
  cursor: {
    line: number;
    column: number;
  };
  color: string;
}

export interface CollaborativeSession {
  id: string;
  projectId: string;
  users: Map<string, CollaborativeUser>;
  code: string;
  version: number;
  lastUpdate: Date;
  changes: ChangeOperation[];
}

export interface ChangeOperation {
  id: string;
  userId: string;
  type: 'insert' | 'delete';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
  version: number;
}

export interface CursorPosition {
  userId: string;
  line: number;
  column: number;
  color: string;
}

export interface ActivityEvent {
  userId: string;
  type: 'join' | 'leave' | 'edit' | 'comment';
  timestamp: number;
  metadata?: any;
}

class CollaborativeServer {
  private io: SocketIOServer;
  private sessions: Map<string, CollaborativeSession> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> projectId mapping

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: ClientSocket) => {
      console.log(`User connected: ${socket.id}`);

      // Join project collaboration
      socket.on('join-project', (data: { projectId: string; user: CollaborativeUser }) => {
        this.handleUserJoin(socket, data);
      });

      // Leave project collaboration
      socket.on('leave-project', (data: { projectId: string }) => {
        this.handleUserLeave(socket, data);
      });

      // Handle code changes (insert/delete)
      socket.on('code-change', (data: { projectId: string; operation: ChangeOperation }) => {
        this.handleCodeChange(socket, data);
      });

      // Handle cursor movement
      socket.on('cursor-move', (data: { projectId: string; cursor: CursorPosition }) => {
        this.handleCursorMove(socket, data);
      });

      // Ping/heartbeat
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  private handleUserJoin(socket: ClientSocket, data: { projectId: string; user: CollaborativeUser }) {
    const { projectId, user } = data;

    // Join socket to room
    socket.join(`project:${projectId}`);
    this.userSessions.set(user.id, projectId);

    // Get or create session
    let session = this.sessions.get(projectId);
    if (!session) {
      session = {
        id: projectId,
        projectId,
        users: new Map(),
        code: '',
        version: 0,
        lastUpdate: new Date(),
        changes: [],
      };
      this.sessions.set(projectId, session);
    }

    // Add user to session
    session.users.set(user.id, user);

    // Emit user joined to other users
    socket.to(`project:${projectId}`).emit('user-joined', {
      user,
      totalUsers: session.users.size,
    });

    // Send existing users to new user
    socket.emit('users-in-project', {
      users: Array.from(session.users.values()),
      code: session.code,
      version: session.version,
    });

    // Log activity
    this.logActivity(projectId, {
      userId: user.id,
      type: 'join',
      timestamp: Date.now(),
    });

    console.log(`User ${user.id} joined project ${projectId}`);
  }

  private handleUserLeave(socket: ClientSocket, data: { projectId: string }) {
    const { projectId } = data;
    const session = this.sessions.get(projectId);

    if (session) {
      // Find and remove user
      let leftUser: CollaborativeUser | undefined;
      for (const [userId, user] of session.users) {
        if (user.id === socket.id) {
          leftUser = user;
          session.users.delete(userId);
          this.userSessions.delete(userId);
          break;
        }
      }

      if (leftUser) {
        // Emit user left to remaining users
        this.io.to(`project:${projectId}`).emit('user-left', {
          userId: leftUser.id,
          totalUsers: session.users.size,
        });

        // Log activity
        this.logActivity(projectId, {
          userId: leftUser.id,
          type: 'leave',
          timestamp: Date.now(),
        });

        // Delete session if empty
        if (session.users.size === 0) {
          this.sessions.delete(projectId);
        }
      }
    }

    socket.leave(`project:${projectId}`);
  }

  private handleCodeChange(socket: ClientSocket, data: { projectId: string; operation: ChangeOperation }) {
    const { projectId, operation } = data;
    const session = this.sessions.get(projectId);

    if (!session) {
      socket.emit('error', 'Session not found');
      return;
    }

    // Apply operation to session code
    this.applyOperation(session, operation);

    // Broadcast change to all users in project
    this.io.to(`project:${projectId}`).emit('code-changed', {
      operation,
      code: session.code,
      version: session.version,
    });

    // Log activity
    this.logActivity(projectId, {
      userId: operation.userId,
      type: 'edit',
      timestamp: Date.now(),
      metadata: {
        operationType: operation.type,
        length: operation.type === 'insert' ? operation.content?.length : operation.length,
      },
    });
  }

  private handleCursorMove(socket: ClientSocket, data: { projectId: string; cursor: CursorPosition }) {
    const { projectId, cursor } = data;

    // Broadcast cursor to all users in project (except sender)
    socket.to(`project:${projectId}`).emit('cursor-moved', cursor);
  }

  private handleUserDisconnect(socket: ClientSocket) {
    console.log(`User disconnected: ${socket.id}`);

    // Find and remove user from all sessions
    for (const [projectId, session] of this.sessions) {
      let leftUser: CollaborativeUser | undefined;
      for (const [userId, user] of session.users) {
        if (user.id === socket.id) {
          leftUser = user;
          session.users.delete(userId);
          break;
        }
      }

      if (leftUser) {
        this.io.to(`project:${projectId}`).emit('user-left', {
          userId: leftUser.id,
          totalUsers: session.users.size,
        });

        if (session.users.size === 0) {
          this.sessions.delete(projectId);
        }
      }
    }
  }

  private applyOperation(session: CollaborativeSession, operation: ChangeOperation) {
    if (operation.type === 'insert' && operation.content) {
      session.code =
        session.code.slice(0, operation.position) +
        operation.content +
        session.code.slice(operation.position);
    } else if (operation.type === 'delete' && operation.length) {
      session.code =
        session.code.slice(0, operation.position) +
        session.code.slice(operation.position + operation.length);
    }

    session.version++;
    session.lastUpdate = new Date();
    session.changes.push(operation);
  }

  private logActivity(projectId: string, event: ActivityEvent) {
    // TODO: Persist activity to database
    console.log(`Activity in ${projectId}:`, event);
  }

  public getSession(projectId: string): CollaborativeSession | undefined {
    return this.sessions.get(projectId);
  }

  public getAllSessions() {
    return Array.from(this.sessions.values());
  }
}

export function setupCollaborativeServer(httpServer: HTTPServer): CollaborativeServer {
  return new CollaborativeServer(httpServer);
}
