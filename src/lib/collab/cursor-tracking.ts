// Real-time cursor and presence tracking system
// Enables showing other users' cursor positions and editing activity

export interface CursorPosition {
  userId: string;
  userEmail: string;
  userName: string;
  line: number;
  column: number;
  color: string;
  timestamp: number;
  isActive: boolean;
}

export interface UserPresence {
  userId: string;
  userEmail: string;
  userName: string;
  color: string;
  lastSeen: number;
  isOnline: boolean;
  currentFile?: string;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface SelectionRange {
  start: number;
  end: number;
  userId: string;
  color: string;
}

/**
 * Cursor Tracking Engine
 * Manages cursor positions and user presence in real-time
 */
export class CursorTrackingEngine {
  private cursors: Map<string, CursorPosition> = new Map();
  private presenceMap: Map<string, UserPresence> = new Map();
  private inactivityTimeout: number = 30000; // 30 seconds
  private inactivityTimers: Map<string, NodeJS.Timeout> = new Map();
  private colorPalette: string[] = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B739', // Gold
    '#52C0A1', // Green
  ];
  private userColorMap: Map<string, string> = new Map();
  private colorIndex: number = 0;

  constructor(inactivityTimeout?: number) {
    if (inactivityTimeout) {
      this.inactivityTimeout = inactivityTimeout;
    }
  }

  /**
   * Assign a unique color to a user
   */
  private assignUserColor(userId: string): string {
    if (this.userColorMap.has(userId)) {
      return this.userColorMap.get(userId)!;
    }

    const color =
      this.colorPalette[this.colorIndex % this.colorPalette.length];
    this.userColorMap.set(userId, color);
    this.colorIndex++;

    return color;
  }

  /**
   * Update cursor position for a user
   */
  updateCursorPosition(
    userId: string,
    userEmail: string,
    userName: string,
    line: number,
    column: number
  ): CursorPosition {
    const color = this.assignUserColor(userId);

    const cursor: CursorPosition = {
      userId,
      userEmail,
      userName,
      line,
      column,
      color,
      timestamp: Date.now(),
      isActive: true,
    };

    this.cursors.set(userId, cursor);

    // Reset inactivity timer
    this.resetInactivityTimer(userId);

    return cursor;
  }

  /**
   * Update text selection range for a user
   */
  updateSelectionRange(
    userId: string,
    selectionStart: number,
    selectionEnd: number
  ): void {
    const presence = this.presenceMap.get(userId);
    if (presence) {
      presence.selectionStart = selectionStart;
      presence.selectionEnd = selectionEnd;
    }
  }

  /**
   * Mark user as online and create presence record
   */
  userJoined(
    userId: string,
    userEmail: string,
    userName: string,
    currentFile?: string
  ): UserPresence {
    const color = this.assignUserColor(userId);

    const presence: UserPresence = {
      userId,
      userEmail,
      userName,
      color,
      lastSeen: Date.now(),
      isOnline: true,
      currentFile,
    };

    this.presenceMap.set(userId, presence);
    this.resetInactivityTimer(userId);

    return presence;
  }

  /**
   * Mark user as offline
   */
  userLeft(userId: string): void {
    const timer = this.inactivityTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.inactivityTimers.delete(userId);
    }

    this.cursors.delete(userId);

    const presence = this.presenceMap.get(userId);
    if (presence) {
      presence.isOnline = false;
      presence.lastSeen = Date.now();
    }
  }

  /**
   * Reset inactivity timer for a user
   */
  private resetInactivityTimer(userId: string): void {
    // Clear existing timer
    const existingTimer = this.inactivityTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.markUserInactive(userId);
    }, this.inactivityTimeout);

    this.inactivityTimers.set(userId, timer);
  }

  /**
   * Mark user as inactive
   */
  private markUserInactive(userId: string): void {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.isActive = false;
    }
  }

  /**
   * Get cursor position for a specific user
   */
  getCursorPosition(userId: string): CursorPosition | undefined {
    return this.cursors.get(userId);
  }

  /**
   * Get all active cursors (excluding a specific user)
   */
  getActiveCursors(excludeUserId?: string): CursorPosition[] {
    return Array.from(this.cursors.values()).filter(
      (cursor) =>
        cursor.isActive &&
        (!excludeUserId || cursor.userId !== excludeUserId)
    );
  }

  /**
   * Get all cursors (including inactive)
   */
  getAllCursors(excludeUserId?: string): CursorPosition[] {
    return Array.from(this.cursors.values()).filter(
      (cursor) => !excludeUserId || cursor.userId !== excludeUserId
    );
  }

  /**
   * Get presence information for a specific user
   */
  getUserPresence(userId: string): UserPresence | undefined {
    return this.presenceMap.get(userId);
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceMap.values()).filter(
      (presence) => presence.isOnline
    );
  }

  /**
   * Get all users (including offline)
   */
  getAllUsers(): UserPresence[] {
    return Array.from(this.presenceMap.values());
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.presenceMap.size;
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.getOnlineUsers().length;
  }

  /**
   * Cleanup: remove offline users after extended inactivity
   */
  cleanupOfflineUsers(maxOfflineAge: number = 3600000): void {
    // 1 hour default
    const now = Date.now();

    for (const [userId, presence] of this.presenceMap.entries()) {
      if (
        !presence.isOnline &&
        now - presence.lastSeen > maxOfflineAge
      ) {
        this.presenceMap.delete(userId);
        this.userColorMap.delete(userId);
        this.cursors.delete(userId);
      }
    }
  }

  /**
   * Get user color
   */
  getUserColor(userId: string): string {
    return this.assignUserColor(userId);
  }

  /**
   * Get selection ranges for all users
   */
  getSelectionRanges(excludeUserId?: string): SelectionRange[] {
    const ranges: SelectionRange[] = [];

    for (const presence of this.presenceMap.values()) {
      if (
        excludeUserId &&
        presence.userId === excludeUserId
      ) {
        continue;
      }

      if (
        presence.selectionStart !== undefined &&
        presence.selectionEnd !== undefined
      ) {
        ranges.push({
          start: presence.selectionStart,
          end: presence.selectionEnd,
          userId: presence.userId,
          color: presence.color,
        });
      }
    }

    return ranges;
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.cursors.clear();
    this.presenceMap.clear();
    this.inactivityTimers.forEach((timer) => clearTimeout(timer));
    this.inactivityTimers.clear();
    this.userColorMap.clear();
    this.colorIndex = 0;
  }
}

/**
 * Client-side cursor tracking
 */
export class ClientCursorTracker {
  private engine: CursorTrackingEngine;
  private userId: string;
  private currentCursor: CursorPosition | null = null;
  private cursorUpdateCallback?: (cursor: CursorPosition) => void;
  private presenceUpdateCallback?: (presence: UserPresence) => void;

  constructor(userId: string) {
    this.userId = userId;
    this.engine = new CursorTrackingEngine();
  }

  /**
   * Initialize client with user info
   */
  initialize(
    userEmail: string,
    userName: string,
    currentFile?: string
  ): UserPresence {
    return this.engine.userJoined(
      this.userId,
      userEmail,
      userName,
      currentFile
    );
  }

  /**
   * Report cursor position update
   */
  updateCursor(line: number, column: number): CursorPosition {
    const cursor = this.engine.updateCursorPosition(
      this.userId,
      this.getCurrentUserEmail(),
      this.getCurrentUserName(),
      line,
      column
    );
    this.currentCursor = cursor;

    if (this.cursorUpdateCallback) {
      this.cursorUpdateCallback(cursor);
    }

    return cursor;
  }

  /**
   * Report selection range
   */
  updateSelection(selectionStart: number, selectionEnd: number): void {
    this.engine.updateSelectionRange(
      this.userId,
      selectionStart,
      selectionEnd
    );
  }

  /**
   * Get all remote cursors
   */
  getRemoteCursors(): CursorPosition[] {
    return this.engine.getActiveCursors(this.userId);
  }

  /**
   * Get all users including self
   */
  getOnlineUsers(): UserPresence[] {
    return this.engine.getOnlineUsers();
  }

  /**
   * Get remote selection ranges
   */
  getRemoteSelections(): SelectionRange[] {
    return this.engine.getSelectionRanges(this.userId);
  }

  /**
   * Set callback for cursor updates
   */
  onCursorUpdate(callback: (cursor: CursorPosition) => void): void {
    this.cursorUpdateCallback = callback;
  }

  /**
   * Set callback for presence updates
   */
  onPresenceUpdate(callback: (presence: UserPresence) => void): void {
    this.presenceUpdateCallback = callback;
  }

  /**
   * Cleanup on disconnect
   */
  cleanup(): void {
    this.engine.userLeft(this.userId);
  }

  private getCurrentUserEmail(): string {
    // This would be populated from session/context
    return 'user@example.com';
  }

  private getCurrentUserName(): string {
    // This would be populated from session/context
    return 'User';
  }
}

/**
 * Server-side cursor tracking
 */
export class ServerCursorTracker {
  private engine: CursorTrackingEngine;

  constructor() {
    this.engine = new CursorTrackingEngine();
  }

  /**
   * Broadcast cursor update to all clients
   */
  broadcastCursorUpdate(
    userId: string,
    userEmail: string,
    userName: string,
    line: number,
    column: number
  ): CursorPosition {
    return this.engine.updateCursorPosition(
      userId,
      userEmail,
      userName,
      line,
      column
    );
  }

  /**
   * Handle user join
   */
  handleUserJoin(
    userId: string,
    userEmail: string,
    userName: string,
    currentFile?: string
  ): { newUser: UserPresence; onlineUsers: UserPresence[] } {
    const newUser = this.engine.userJoined(
      userId,
      userEmail,
      userName,
      currentFile
    );
    const onlineUsers = this.engine.getOnlineUsers();

    return { newUser, onlineUsers };
  }

  /**
   * Handle user leave
   */
  handleUserLeave(userId: string): void {
    this.engine.userLeft(userId);
  }

  /**
   * Get all active cursors for broadcasting
   */
  getActiveCursorsForBroadcast(
    excludeUserId?: string
  ): CursorPosition[] {
    return this.engine.getActiveCursors(excludeUserId);
  }

  /**
   * Get online user list
   */
  getOnlineUsersList(): UserPresence[] {
    return this.engine.getOnlineUsers();
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.engine.getUserCount();
  }

  /**
   * Cleanup offline users
   */
  cleanupOfflineUsers(): void {
    this.engine.cleanupOfflineUsers();
  }
}
