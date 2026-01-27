"use client";


import { AIInsight } from "@/lib/type";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Gauge,
} from "lucide-react";

interface InsightDisplayProps {
  insight: AIInsight;
  question: string;
}

export default function InsightDisplay({
  insight,
  question,
}: InsightDisplayProps) {
  const { summary, confidence, patterns, warnings, metadata } = insight;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "text-green-400";
    if (conf >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceBgColor = (conf: number) => {
    if (conf >= 80) return "bg-green-500";
    if (conf >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 80) return "High Confidence";
    if (conf >= 60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Question Context */}
      <div className="glass rounded-xl p-4 border-l-4 border-primary-500">
        <p className="text-sm text-slate-400 mb-1">Your Question</p>
        <p className="text-slate-200 font-medium">{question}</p>
      </div>

      {/* Main Insight Card */}
      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Confidence Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-slate-900 rounded-full">
                <Gauge
                  className={`w-5 h-5 ${getConfidenceColor(confidence)}`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-400">Confidence Score</p>
              <p
                className={`text-lg font-display font-bold ${getConfidenceColor(confidence)}`}
              >
                {confidence}% · {getConfidenceLabel(confidence)}
              </p>
            </div>
          </div>

          {/* Visual Confidence Bar */}
          <div className="hidden md:block w-32">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${getConfidenceBgColor(confidence)}`}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Key Findings
          </h3>
          <p className="text-slate-100 leading-relaxed">{summary}</p>
        </div>

        {/* Patterns */}
        {patterns.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Detected Patterns
            </h3>
            <div className="space-y-3">
              {patterns.map((pattern, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-slate-900/50 rounded-xl border border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`
                      px-2 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider
                      ${
                        pattern.type === "trend"
                          ? "bg-blue-500/20 text-blue-400"
                          : pattern.type === "correlation"
                            ? "bg-purple-500/20 text-purple-400"
                            : pattern.type === "outlier"
                              ? "bg-red-500/20 text-red-400"
                              : pattern.type === "distribution"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-slate-700/50 text-slate-400"
                      }
                    `}
                    >
                      {pattern.type}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">
                        {pattern.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pattern.confidence}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={getConfidenceBgColor(pattern.confidence)}
                          />
                        </div>
                        <span
                          className={`text-xs font-mono ${getConfidenceColor(pattern.confidence)}`}
                        >
                          {pattern.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-400">
                Important Considerations
              </h3>
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-sm text-yellow-300/90 flex items-start gap-2"
                >
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                {metadata.processingTime && (
                  <span>
                    Processed in {(metadata.processingTime / 1000).toFixed(1)}s
                  </span>
                )}
                {metadata.modelUsed && (
                  <span className="font-mono">{metadata.modelUsed}</span>
                )}
              </div>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
