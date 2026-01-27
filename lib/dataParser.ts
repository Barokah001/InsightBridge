import Papa from "papaparse";
import { DataQualityIssue, ParsedData } from "./type";


export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = analyzeData(results.data as Record<string, unknown>[]);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseJSON(jsonString: string): ParsedData {
  try {
    const data = JSON.parse(jsonString);
    const rows = Array.isArray(data) ? data : [data];
    return analyzeData(rows);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}

function analyzeData(rows: Record<string, unknown>[]): ParsedData {
  if (rows.length === 0) {
    throw new Error("No data found");
  }

  const headers = Object.keys(rows[0]);
  const columnTypes: Record<string, "number" | "string" | "date"> = {};

  // Detect column types
  headers.forEach((header) => {
    const sampleValues = rows
      .slice(0, 10)
      .map((row) => row[header])
      .filter((v) => v != null);

    if (sampleValues.every((v) => typeof v === "number" || !isNaN(Number(v)))) {
      columnTypes[header] = "number";
    } else if (sampleValues.some((v) => isValidDate(v))) {
      columnTypes[header] = "date";
    } else {
      columnTypes[header] = "string";
    }
  });

  // Count missing values
  let missingValues = 0;
  rows.forEach((row) => {
    headers.forEach((header) => {
      if (row[header] == null || row[header] === "") {
        missingValues++;
      }
    });
  });

  const numericColumns = headers.filter((h) => columnTypes[h] === "number");
  const textColumns = headers.filter((h) => columnTypes[h] === "string");
  const dateColumns = headers.filter((h) => columnTypes[h] === "date");

  return {
    headers,
    rows,
    rowCount: rows.length,
    columnTypes,
    summary: {
      totalRows: rows.length,
      totalColumns: headers.length,
      missingValues,
      numericColumns,
      textColumns,
      dateColumns,
    },
  };
}

function isValidDate(value: unknown): boolean {
  if (typeof value === "string") {
    const date = new Date(value);
    const hasValidDateFormat =
      /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value);
    return !isNaN(date.getTime()) && hasValidDateFormat;
  }
  return false;
}

export function detectQualityIssues(data: ParsedData): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  // Check for missing values
  const missingPercentage =
    (data.summary.missingValues / (data.rowCount * data.headers.length)) * 100;
  if (missingPercentage > 5) {
    issues.push({
      type: "missing",
      severity: missingPercentage > 20 ? "high" : "medium",
      description: `${missingPercentage.toFixed(1)}% of data points are missing`,
    });
  }

  // Check for small sample size
  if (data.rowCount < 10) {
    issues.push({
      type: "invalid",
      severity: "high",
      description:
        "Sample size is very small (< 10 rows). Insights may not be reliable.",
    });
  }

  // Check for outliers in numeric columns
  data.summary.numericColumns.forEach((column) => {
    const values = data.rows
      .map((row) => Number(row[column]))
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const outliers = values.filter((v) => v < lowerBound || v > upperBound);
      if (outliers.length > 0 && outliers.length / values.length > 0.05) {
        issues.push({
          type: "outlier",
          severity: "medium",
          description: `${column} has ${outliers.length} outliers (${((outliers.length / values.length) * 100).toFixed(1)}%)`,
          affectedColumns: [column],
        });
      }
    }
  });

  return issues;
}

export function formatDataForAI(data: ParsedData): string {
  // Create a compact representation for the AI
  const schema = {
    columns: data.headers.map((h) => ({
      name: h,
      type: data.columnTypes[h],
    })),
    rowCount: data.rowCount,
    summary: data.summary,
  };

  // Sample rows (first 5 and last 5)
  const sampleRows = [
    ...data.rows.slice(0, 5),
    ...(data.rows.length > 10 ? data.rows.slice(-5) : []),
  ];

  return JSON.stringify(
    {
      schema,
      sampleRows,
    },
    null,
    2,
  );
}
