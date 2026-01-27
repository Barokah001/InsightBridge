import { AIInsight, ParsedData, Pattern } from "@/lib/type";


export async function queryAI(
  question: string,
  data: ParsedData,
): Promise<AIInsight> {
  // Mock AI response for now - will integrate real AI later
  // This simulates what the AI would return

  await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

  const lowerQuestion = question.toLowerCase();

  // Detect question intent
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
    // Generic response
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
      modelUsed: "mock-gpt-4",
    },
  };
}

export function generatePrompt(question: string, dataContext: string): string {
  return `You are an expert data analyst. Analyze this dataset and answer the following question.

Dataset Context:
${dataContext}

Question: ${question}

Please provide your response in the following JSON format:
{
  "summary": "A clear, concise summary of your findings (2-3 sentences)",
  "confidence": <number between 0-100>,
  "patterns": [
    {
      "type": "trend|correlation|outlier|distribution|comparison",
      "description": "What you found",
      "confidence": <number between 0-100>,
      "visualization": {
        "type": "line|bar|scatter|area|pie|histogram",
        "config": { "xAxis": "column_name", "yAxis": "column_name" }
      }
    }
  ],
  "warnings": ["Any data quality concerns or caveats"]
}

Important:
- Be specific with numbers and insights
- Express uncertainty when appropriate
- Recommend visualizations that best show the pattern
- Flag any data quality issues that affect confidence`;
}
