"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DataQualityIssue, ParsedData } from "./type";

// Excel file parsing
export async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

        if (jsonData.length === 0) {
          throw new Error("Excel file is empty");
        }

        const parsed = analyzeData(jsonData as Record<string, unknown>[]);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read Excel file"));
    reader.readAsArrayBuffer(file);
  });
}

// PDF table extraction
export async function parsePDF(file: File): Promise<ParsedData> {
  try {
    // Dynamic import for client-side only
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let allText = "";

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Fix: Properly handle TextItem and TextMarkedContent types
      const pageText = textContent.items
        .map((item) => {
          // Check if item has 'str' property (TextItem)
          if ('str' in item) {
            return item.str;
          }
          return ''; // TextMarkedContent doesn't have str
        })
        .join(" ");
      allText += pageText + "\n";
    }

    // Parse as structured data - AWAIT the promise
    const parsed = await parseTextToData(allText);
    return parsed;
  } catch (error) {
    throw new Error(
      "Failed to parse PDF. Please ensure it contains tabular data.",
    );
  }
}

// Image OCR parsing
export async function parseImage(file: File): Promise<ParsedData> {
  try {
    // Dynamic import for Tesseract
    const Tesseract = await import("tesseract.js");

    const {
      data: { text },
    } = await Tesseract.recognize(file, "eng", {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Parse extracted text - AWAIT the promise
    const parsed = await parseTextToData(text);
    return parsed;
  } catch (error) {
    throw new Error(
      "Failed to extract text from image. Please ensure the image contains clear, readable data.",
    );
  }
}

// Helper: Parse text to structured data - Returns PROMISE
async function parseTextToData(text: string): Promise<ParsedData> {
  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(
      "Could not find enough data. Please ensure the file contains tabular information.",
    );
  }

  // Try to detect delimiter
  const delimiters = [",", "\t", "|", ";"];
  let bestDelimiter = ",";
  let maxColumns = 0;

  for (const delimiter of delimiters) {
    const columns = lines[0].split(delimiter).length;
    if (columns > maxColumns) {
      maxColumns = columns;
      bestDelimiter = delimiter;
    }
  }

  // Parse as CSV with detected delimiter
  const csvText = lines.join("\n");

  return new Promise<ParsedData>((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      delimiter: bestDelimiter,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error("No data could be extracted"));
            return;
          }
          const parsed = analyzeData(results.data as Record<string, unknown>[]);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

// Original CSV parser
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
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

// Original JSON parser
export function parseJSON(jsonString: string): ParsedData {
  try {
    const data = JSON.parse(jsonString);
    const rows = Array.isArray(data) ? data : [data];
    return analyzeData(rows);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
}

// Analyze data helper
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
  const schema = {
    columns: data.headers.map((h) => ({
      name: h,
      type: data.columnTypes[h],
    })),
    rowCount: data.rowCount,
    summary: data.summary,
  };

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