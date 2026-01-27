export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  columnTypes: Record<string, "number" | "string" | "date">;
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    numericColumns: string[];
    textColumns: string[];
    dateColumns: string[];
  };
}

export interface AIInsight {
  summary: string;
  confidence: number;
  patterns: Pattern[];
  suggestedViz?: VisualizationType;
  warnings?: string[];
  metadata: {
    tokensUsed?: number;
    processingTime?: number;
    modelUsed?: string;
  };
}

export interface Pattern {
  type: "trend" | "correlation" | "outlier" | "distribution" | "comparison";
  description: string;
  confidence: number;
  dataPoints?: unknown[];
  visualization?: {
    type: VisualizationType;
    config: Record<string, unknown>;
  };
}

export type VisualizationType =
  | "line"
  | "bar"
  | "scatter"
  | "area"
  | "pie"
  | "histogram";

export interface Question {
  id: string;
  text: string;
  timestamp: Date;
  response?: AIInsight;
  refinements?: Question[];
}

export interface DataQualityIssue {
  type: "missing" | "outlier" | "duplicate" | "invalid";
  severity: "low" | "medium" | "high";
  description: string;
  affectedRows?: number[];
  affectedColumns?: string[];
}

export interface FeedbackItem {
  questionId: string;
  type: "correct" | "incorrect" | "unclear";
  comment?: string;
  timestamp: Date;
}
