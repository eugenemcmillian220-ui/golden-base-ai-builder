// Operational Transformation (OT) algorithm for conflict-free collaborative editing
// This implements the core OT concepts for real-time text synchronization

export interface Operation {
  id: string;
  userId: string;
  type: 'insert' | 'delete';
  position: number;
  content?: string; // For insert operations
  length?: number; // For delete operations
  timestamp: number;
  version: number;
}

export interface TransformResult {
  operation: Operation;
  version: number;
}

/**
 * Operational Transformation Engine
 * Handles conflict resolution and operation transformation for collaborative editing
 */
export class OperationalTransformationEngine {
  private operations: Operation[] = [];
  private version: number = 0;

  constructor() {
    this.reset();
  }

  /**
   * Reset the OT engine
   */
  reset(): void {
    this.operations = [];
    this.version = 0;
  }

  /**
   * Increment and get current version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Apply a local operation and return transformed operation
   */
  applyLocalOperation(operation: Operation): Operation {
    operation.version = this.version;
    this.operations.push(operation);
    this.version++;

    return {
      ...operation,
      version: this.version - 1,
    };
  }

  /**
   * Apply a remote operation and transform it against local operations
   * Returns the transformed operation that can be safely applied
   */
  applyRemoteOperation(remoteOp: Operation): Operation {
    if (remoteOp.version === this.version) {
      // Remote operation is at current version, apply directly
      this.operations.push(remoteOp);
      this.version++;
      return remoteOp;
    }

    // Transform remote operation against local operations
    let transformedOp = { ...remoteOp };

    for (
      let i = remoteOp.version;
      i < Math.min(this.operations.length, this.version);
      i++
    ) {
      const localOp = this.operations[i];
      transformedOp = this.transform(transformedOp, localOp, 'remote');
    }

    this.operations.push(transformedOp);
    this.version++;

    return transformedOp;
  }

  /**
   * Transform two concurrent operations
   * Returns the transformed operation
   */
  private transform(
    op1: Operation,
    op2: Operation,
    priority: 'local' | 'remote'
  ): Operation {
    // If one operation is at position we're transforming, adjust position
    const result = { ...op1 };

    if (op1.type === 'insert' && op2.type === 'insert') {
      result.position = this.transformInsertInsert(
        op1.position,
        op2.position,
        priority
      );
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      result.position = this.transformInsertDelete(
        op1.position,
        op2.position,
        op2.length || 1
      );
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      result.position = this.transformDeleteInsert(
        op1.position,
        op2.position,
        op2.content?.length || 0
      );
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      result.position = this.transformDeleteDelete(
        op1.position,
        op2.position,
        op1.length || 1,
        op2.length || 1
      );
    }

    return result;
  }

  /**
   * Transform Insert vs Insert
   */
  private transformInsertInsert(
    pos1: number,
    pos2: number,
    priority: 'local' | 'remote'
  ): number {
    if (pos1 < pos2) {
      return pos1;
    } else if (pos1 > pos2) {
      return pos1 + 1;
    } else {
      // Same position: use priority (timestamp or user ID)
      return priority === 'local' ? pos1 : pos1 + 1;
    }
  }

  /**
   * Transform Insert vs Delete
   */
  private transformInsertDelete(
    insertPos: number,
    deletePos: number,
    deleteLength: number
  ): number {
    if (insertPos < deletePos) {
      return insertPos;
    } else if (insertPos > deletePos + deleteLength) {
      return insertPos - deleteLength;
    } else {
      // Insert is within delete range
      return deletePos;
    }
  }

  /**
   * Transform Delete vs Insert
   */
  private transformDeleteInsert(
    deletePos: number,
    insertPos: number,
    insertLength: number
  ): number {
    if (deletePos < insertPos) {
      return deletePos;
    } else if (deletePos >= insertPos) {
      return deletePos + insertLength;
    }
    return deletePos;
  }

  /**
   * Transform Delete vs Delete
   */
  private transformDeleteDelete(
    deletePos1: number,
    deletePos2: number,
    deleteLength1: number,
    deleteLength2: number
  ): number {
    if (deletePos1 < deletePos2) {
      return deletePos1;
    } else if (deletePos1 > deletePos2 + deleteLength2) {
      return deletePos1 - deleteLength2;
    } else {
      // Overlapping deletes - adjust position
      return Math.min(deletePos1, deletePos2);
    }
  }

  /**
   * Get all operations since a certain version
   */
  getOperationsSince(version: number): Operation[] {
    return this.operations.slice(version);
  }

  /**
   * Get the full history of operations
   */
  getHistory(): Operation[] {
    return [...this.operations];
  }

  /**
   * Apply a sequence of operations to compute final state
   * Used for state reconstruction
   */
  static applyOperationsToText(
    text: string,
    operations: Operation[]
  ): string {
    let result = text;

    // Sort operations by position to apply deletes before inserts at same position
    const sorted = [...operations].sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return a.type === 'delete' ? -1 : 1;
    });

    for (const op of sorted) {
      if (op.type === 'insert' && op.content) {
        result =
          result.slice(0, op.position) +
          op.content +
          result.slice(op.position);
      } else if (op.type === 'delete' && op.length) {
        result = result.slice(0, op.position) + result.slice(op.position + op.length);
      }
    }

    return result;
  }

  /**
   * Compress operations for efficient transmission
   * Combines consecutive operations on adjacent positions
   */
  static compressOperations(operations: Operation[]): Operation[] {
    if (operations.length === 0) return [];

    const compressed: Operation[] = [];
    let current = { ...operations[0] };

    for (let i = 1; i < operations.length; i++) {
      const next = operations[i];

      // Try to combine with current if consecutive inserts
      if (
        current.type === 'insert' &&
        next.type === 'insert' &&
        current.userId === next.userId &&
        current.position + (current.content?.length || 0) === next.position
      ) {
        current = {
          ...current,
          content: (current.content || '') + (next.content || ''),
        };
      } else {
        compressed.push(current);
        current = { ...next };
      }
    }

    compressed.push(current);
    return compressed;
  }
}

/**
 * OT Client - manages local operations and reconciliation with server
 */
export class OTClient {
  private engine: OperationalTransformationEngine;
  private pendingOperations: Operation[] = [];
  private acknowledgedVersion: number = 0;

  constructor() {
    this.engine = new OperationalTransformationEngine();
  }

  /**
   * Create and send a local operation
   */
  createOperation(
    userId: string,
    type: 'insert' | 'delete',
    position: number,
    content?: string,
    length?: number
  ): Operation {
    const operation: Operation = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      type,
      position,
      content,
      length,
      timestamp: Date.now(),
      version: this.engine.getVersion(),
    };

    const result = this.engine.applyLocalOperation(operation);
    this.pendingOperations.push(result);

    return result;
  }

  /**
   * Acknowledge that a pending operation was applied on server
   */
  acknowledgeOperation(operationId: string): void {
    this.pendingOperations = this.pendingOperations.filter(
      (op) => op.id !== operationId
    );
    this.acknowledgedVersion = this.engine.getVersion();
  }

  /**
   * Apply a remote operation
   */
  applyRemoteOperation(operation: Operation): Operation {
    return this.engine.applyRemoteOperation(operation);
  }

  /**
   * Get pending operations that haven't been acknowledged
   */
  getPendingOperations(): Operation[] {
    return [...this.pendingOperations];
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.engine.getVersion();
  }

  /**
   * Get operation history
   */
  getHistory(): Operation[] {
    return this.engine.getHistory();
  }

  /**
   * Reset client state (on reconnect)
   */
  reset(): void {
    this.engine.reset();
    this.pendingOperations = [];
    this.acknowledgedVersion = 0;
  }
}

/**
 * OT Server - manages state and transforms operations
 */
export class OTServer {
  private engine: OperationalTransformationEngine;
  private documentState: string = '';

  constructor(initialState: string = '') {
    this.engine = new OperationalTransformationEngine();
    this.documentState = initialState;
  }

  /**
   * Receive and process a client operation
   */
  processClientOperation(
    operation: Operation
  ): { transformedOp: Operation; newState: string } {
    const transformedOp = this.engine.applyRemoteOperation(operation);

    // Apply operation to document state
    if (transformedOp.type === 'insert' && transformedOp.content) {
      this.documentState =
        this.documentState.slice(0, transformedOp.position) +
        transformedOp.content +
        this.documentState.slice(transformedOp.position);
    } else if (transformedOp.type === 'delete' && transformedOp.length) {
      this.documentState =
        this.documentState.slice(0, transformedOp.position) +
        this.documentState.slice(transformedOp.position + transformedOp.length);
    }

    return {
      transformedOp,
      newState: this.documentState,
    };
  }

  /**
   * Get current document state
   */
  getDocumentState(): string {
    return this.documentState;
  }

  /**
   * Get operation history
   */
  getHistory(): Operation[] {
    return this.engine.getHistory();
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.engine.getVersion();
  }
}
