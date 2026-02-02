"use client";

import { AIInsight, ParsedData, Pattern } from "@/lib/type";



// Dynamic import helper for Gemini AI
async function getGeminiAI() {
  if (typeof window === "undefined") {
    return null; // Server-side
  }

  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return null; // No API key
  }

  try {
    // @ts-ignore - Dynamic import
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    return new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  } catch (error) {
    console.warn("Gemini AI SDK not installed. Using mock responses.");
    return null;
  }
}

export async function queryAI(
  question: string,
  data: ParsedData,
): Promise<AIInsight> {
  const startTime = Date.now();

  // Try to initialize Gemini
  const genAI = await getGeminiAI();

  // If no API or initialization failed, use mock
  if (!genAI) {
    console.log(
      "Using mock AI responses. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local for real AI.",
    );
    return getMockResponse(question, data);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = generatePrompt(question, formatDataForAI(data));

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanText);

      return {
        ...parsed,
        metadata: {
          ...parsed.metadata,
          processingTime: Date.now() - startTime,
          modelUsed: "gemini-1.5-pro",
        },
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback: extract what we can
      return {
        summary: text.substring(0, 500),
        confidence: 50,
        patterns: [],
        warnings: [
          "Unable to parse structured response. Showing raw AI output.",
        ],
        metadata: {
          processingTime: Date.now() - startTime,
          modelUsed: "gemini-1.5-pro",
        },
      };
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback to mock on error
    return getMockResponse(question, data);
  }
}

// Mock response for when API is unavailable
async function getMockResponse(
  question: string,
  data: ParsedData,
): Promise<AIInsight> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const lowerQuestion = question.toLowerCase();

  const isTrend = /trend|over time|change|growth|increase|decrease/i.test(
    question,
  );
  const isCorrelation = /correlat|relationship|connect|affect|impact/i.test(
    question,
  );
  const isComparison = /compar|versus|vs|difference|between/i.test(question);
  const isDistribution = /distribut|spread|range|average|mean|median/i.test(
    question,
  );

  let confidence = 75;
  const patterns: Pattern[] = [];
  let summary = "";
  const warnings: string[] = [];

  // Adjust confidence based on data quality
  if (data.rowCount < 20) {
    confidence -= 20;
    warnings.push("Small sample size may affect reliability");
  }

  if (data.summary.missingValues > data.rowCount * data.headers.length * 0.1) {
    confidence -= 15;
    warnings.push("High percentage of missing values detected");
  }

  // Generate patterns based on question type
  if (isTrend && data.summary.numericColumns.length > 0) {
    const column = data.summary.numericColumns[0];
    patterns.push({
      type: "trend",
      description: `${column} shows an upward trend with some fluctuations`,
      confidence: confidence,
      visualization: {
        type: "line",
        config: { xAxis: "index", yAxis: column },
      },
    });
    summary = `Based on the analysis of ${data.rowCount} data points, there's a noticeable upward trend in ${column}. The pattern suggests consistent growth with minor variations.`;
  } else if (isCorrelation && data.summary.numericColumns.length >= 2) {
    const col1 = data.summary.numericColumns[0];
    const col2 = data.summary.numericColumns[1];
    patterns.push({
      type: "correlation",
      description: `Moderate positive correlation detected between ${col1} and ${col2}`,
      confidence: confidence - 10,
      visualization: {
        type: "scatter",
        config: { xAxis: col1, yAxis: col2 },
      },
    });
    summary = `Analysis reveals a moderate positive correlation (r ≈ 0.65) between ${col1} and ${col2}. As ${col1} increases, ${col2} tends to increase as well, though the relationship isn't perfectly linear.`;
  } else if (isDistribution && data.summary.numericColumns.length > 0) {
    const column = data.summary.numericColumns[0];
    patterns.push({
      type: "distribution",
      description: `${column} follows a roughly normal distribution`,
      confidence: confidence,
      visualization: {
        type: "histogram",
        config: { column },
      },
    });
    summary = `The distribution of ${column} appears roughly normal with most values concentrated around the mean. There are a few outliers on both ends that warrant closer inspection.`;
  } else {
    summary = `Based on ${data.rowCount} records across ${data.headers.length} columns, the data shows interesting patterns. ${data.summary.numericColumns.length} numeric columns are available for quantitative analysis.`;
    patterns.push({
      type: "comparison",
      description: "General data overview available",
      confidence: confidence - 20,
    });
    warnings.push("Question could be more specific for better insights");
  }

  return {
    summary,
    confidence,
    patterns,
    suggestedViz: patterns[0]?.visualization?.type,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      tokensUsed: 850,
      processingTime: 1500,
      modelUsed: "mock-response",
    },
  };
}

export function generatePrompt(question: string, dataContext: string): string {
  return `You are an expert data analyst. Analyze this dataset and answer the following question with high precision.

Dataset Context:
${dataContext}

User Question: ${question}

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no explanations):
{
  "summary": "A clear 2-3 sentence summary of your findings with specific numbers",
  "confidence": 85,
  "patterns": [
    {
      "type": "trend",
      "description": "Specific finding with data",
      "confidence": 85,
      "visualization": {
        "type": "line",
        "config": {"xAxis": "column_name", "yAxis": "column_name"}
      }
    }
  ],
  "warnings": ["Any data quality concerns"]
}

Rules:
1. Use pattern types: "trend", "correlation", "outlier", "distribution", or "comparison"
2. Use visualization types: "line", "bar", "scatter", "area", "pie", or "histogram"
3. Set confidence 80-100 for strong patterns, 60-79 for moderate, <60 for weak
4. Reduce confidence by 20 for small samples (<20 rows)
5. Include specific numbers and column names in your analysis
6. Be specific with xAxis and yAxis in visualization config
7. Return ONLY valid JSON, no markdown formatting`;
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
