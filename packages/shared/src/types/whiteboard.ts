export type WhiteboardTool = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'ellipse' | 'arrow' | 'text';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  userId: string;
  tool: WhiteboardTool;
  color: string;
  strokeWidth: number;
  points: Point[];
  text?: string;
  timestamp: number;
  isDeleted?: boolean;
}

export interface WhiteboardPointer {
  userId: string;
  userName: string;
  color: string;
  position: Point;
  isDrawing: boolean;
  timestamp: number;
}

export interface FabricCanvasSnapshot {
  version?: string;
  objects: unknown[];
  background?: string;
}

export interface WhiteboardSyncPayload {
  roomId: string;
  snapshot?: FabricCanvasSnapshot | string;
  deltaObject?: unknown;
  strokes?: WhiteboardStroke[];
  clear?: boolean;
  timestamp?: number;
}

