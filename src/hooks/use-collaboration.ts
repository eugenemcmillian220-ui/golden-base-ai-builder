'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OTClient } from '@/lib/collab/operational-transformation';
import { ClientCursorTracker } from '@/lib/collab/cursor-tracking';
import { ActivityLogClient } from '@/lib/collab/activity-log';
import type { CursorPosition, UserPresence } from '@/lib/collab/cursor-tracking';
import type { ActivityEvent } from '@/lib/collab/activity-log';

interface UseCollaborationProps {
  projectId: string;
  userId: string;
  userEmail: string;
  userName: string;
  enabled?: boolean;
  onCodeChange?: (code: string) => void;
  onActivityUpdate?: (event: ActivityEvent) => void;
}

interface CollaborationState {
  isConnected: boolean;
  remoteCursors: CursorPosition[];
  activeUsers: UserPresence[];
  recentActivity: ActivityEvent[];
  syncStatus: 'synced' | 'syncing' | 'error';
  error?: string;
}

/**
 * Hook for managing real-time collaborative editing
 * Handles WebSocket connection, OT sync, cursor tracking, and activity logging
 */
export function useCollaboration({
  projectId,
  userId,
  userEmail,
  userName,
  enabled = true,
  onCodeChange,
  onActivityUpdate,
}: UseCollaborationProps) {
  // Use provided session data instead of next-auth
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    remoteCursors: [],
    activeUsers: [],
    recentActivity: [],
    syncStatus: 'synced',
  });

  const otClientRef = useRef<OTClient | null>(null);
  const cursorTrackerRef = useRef<ClientCursorTracker | null>(null);
  const activityLogRef = useRef<ActivityLogClient | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncQueueRef = useRef<Array<{ type: string; data: any }>>([]);
  const isSyncingRef = useRef(false);

  // Initialize collaboration clients
  useEffect(() => {
    if (!userId || !enabled) return;

    try {
      otClientRef.current = new OTClient();
      cursorTrackerRef.current = new ClientCursorTracker(userId);
      activityLogRef.current = new ActivityLogClient(
        projectId,
        userId,
        userEmail,
        userName
      );

      cursorTrackerRef.current.initialize(userEmail, userName);

      // Listen to activity events
      if (activityLogRef.current) {
        activityLogRef.current.onActivity((event) => {
          setState((prev) => ({
            ...prev,
            recentActivity: [event, ...prev.recentActivity].slice(0, 50),
          }));
          onActivityUpdate?.(event);
        });
      }
    } catch (error) {
      console.error('Failed to initialize collaboration clients:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to initialize collaboration',
        syncStatus: 'error',
      }));
    }
  }, [userId, projectId, enabled, onActivityUpdate]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!enabled || !userId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v2/collab/ws?projectId=${projectId}&userId=${userId}`;

      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('[Collab] WebSocket connected');
        setState((prev) => ({
          ...prev,
          isConnected: true,
          syncStatus: 'synced',
          error: undefined,
        }));

        // Process sync queue
        if (syncQueueRef.current.length > 0) {
          const queue = syncQueueRef.current;
          syncQueueRef.current = [];
          queue.forEach((item) => {
            socketRef.current?.send(JSON.stringify(item));
          });
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'cursor-update':
              setState((prev) => ({
                ...prev,
                remoteCursors: [
                  ...prev.remoteCursors.filter(
                    (c) => c.userId !== message.data.userId
                  ),
                  message.data,
                ],
              }));
              break;

            case 'user-joined':
              setState((prev) => ({
                ...prev,
                activeUsers: [...prev.activeUsers, message.data],
              }));
              break;

            case 'user-left':
              setState((prev) => ({
                ...prev,
                activeUsers: prev.activeUsers.filter(
                  (u) => u.userId !== message.data.userId
                ),
                remoteCursors: prev.remoteCursors.filter(
                  (c) => c.userId !== message.data.userId
                ),
              }));
              break;

            case 'operation':
              if (
                otClientRef.current &&
                message.data.userId !== userId
              ) {
                const transformedOp = otClientRef.current.applyRemoteOperation(
                  message.data
                );
                onCodeChange?.(message.data.content);
              }
              break;

            case 'activity':
              setState((prev) => ({
                ...prev,
                recentActivity: [
                  message.data,
                  ...prev.recentActivity,
                ].slice(0, 50),
              }));
              onActivityUpdate?.(message.data);
              break;

            case 'sync-ack':
              isSyncingRef.current = false;
              setState((prev) => ({
                ...prev,
                syncStatus: 'synced',
              }));
              break;

            default:
              break;
          }
        } catch (error) {
          console.error('[Collab] Failed to process WebSocket message:', error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('[Collab] WebSocket error:', error);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          syncStatus: 'error',
          error: 'WebSocket connection error',
        }));
      };

      socketRef.current.onclose = () => {
        console.log('[Collab] WebSocket disconnected');
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));

        // Attempt reconnect
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    } catch (error) {
      console.error('[Collab] Failed to connect WebSocket:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to connect WebSocket',
        syncStatus: 'error',
      }));
    }
  }, [enabled, userId, projectId, onCodeChange, onActivityUpdate]);

  // Initial connection
  useEffect(() => {
    if (enabled && userId) {
      connectWebSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [enabled, userId, connectWebSocket]);

  // Send cursor position
  const updateCursorPosition = useCallback(
    (line: number, column: number) => {
      if (!cursorTrackerRef.current || !socketRef.current) return;

      const cursor = cursorTrackerRef.current.updateCursor(line, column);

      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'cursor-move',
            data: cursor,
          })
        );
      } else {
        syncQueueRef.current.push({
          type: 'cursor-move',
          data: cursor,
        });
      }
    },
    []
  );

  // Send code edit
  const sendCodeEdit = useCallback(
    (
      type: 'insert' | 'delete',
      position: number,
      content?: string,
      length?: number
    ) => {
      if (!otClientRef.current || !socketRef.current) return;

      setState((prev) => ({
        ...prev,
        syncStatus: 'syncing',
      }));

      const operation = otClientRef.current.createOperation(
        userId || 'anonymous',
        type,
        position,
        content,
        length
      );

      if (socketRef.current.readyState === WebSocket.OPEN) {
        isSyncingRef.current = true;
        socketRef.current.send(
          JSON.stringify({
            type: 'operation',
            data: operation,
          })
        );
      } else {
        syncQueueRef.current.push({
          type: 'operation',
          data: operation,
        });
      }

      // Log activity
      if (activityLogRef.current) {
        activityLogRef.current.logCodeChange('editor', 1);
      }
    },
    [userId]
  );

  // Add comment
  const addComment = useCallback(
    (content: string, lineNumber?: number) => {
      if (!activityLogRef.current || !socketRef.current) return;

      const comment = activityLogRef.current.addComment(
        content,
        'editor',
        lineNumber
      );

      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'comment',
            data: comment,
          })
        );
      } else {
        syncQueueRef.current.push({
          type: 'comment',
          data: comment,
        });
      }

      return comment;
    },
    []
  );

  // Reply to comment
  const replyToComment = useCallback(
    (commentId: string, content: string) => {
      if (!activityLogRef.current || !socketRef.current) return;

      const reply = activityLogRef.current.reply(commentId, content);

      if (reply && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'comment-reply',
            data: reply,
          })
        );
      }

      return reply;
    },
    []
  );

  return {
    ...state,
    updateCursorPosition,
    sendCodeEdit,
    addComment,
    replyToComment,
    reconnect: connectWebSocket,
  };
}
