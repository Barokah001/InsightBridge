"use client";

import { DataQualityIssue, ParsedData } from "@/lib/type";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  TrendingUp, 
} from "lucide-react";

interface DataSummaryProps {
  data: ParsedData;
  qualityIssues?: DataQualityIssue[];
}

export default function DataSummary({
  data,
  qualityIssues = [],
}: DataSummaryProps) {
  const { summary } = data;

  const stats = [
    {
      label: "Total Rows",
      value: summary.totalRows.toLocaleString(),
      icon: Database,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Columns",
      value: summary.totalColumns,
      icon: TrendingUp,
      color: "text-primary-400",
      bgColor: "bg-primary-500/10",
    },
    {
      label: "Numeric Fields",
      value: summary.numericColumns.length,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Missing Values",
      value: summary.missingValues,
      icon: AlertTriangle,
      color: summary.missingValues > 0 ? "text-yellow-400" : "text-green-400",
      bgColor:
        summary.missingValues > 0 ? "bg-yellow-500/10" : "bg-green-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass rounded-xl p-4 hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-display font-bold text-slate-100">
                {stat.value}
              </p>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Column Types */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Data Structure
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {summary.numericColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">
                Numeric Columns
              </p>
              <div className="flex flex-wrap gap-1.5">
                {summary.numericColumns.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded-md font-mono"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.textColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Text Columns</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.textColumns.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-md font-mono"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.dateColumns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">Date Columns</p>
              <div className="flex flex-wrap gap-1.5">
                {summary.dateColumns.map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-md font-mono"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quality Issues */}
      {qualityIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5 space-y-3 border-l-4 border-yellow-500/50"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-yellow-400">
              Data Quality Alerts
            </h3>
          </div>

          <div className="space-y-2">
            {qualityIssues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div
                  className={`
                  w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                  ${
                    issue.severity === "high"
                      ? "bg-red-400"
                      : issue.severity === "medium"
                        ? "bg-yellow-400"
                        : "bg-blue-400"
                  }
                `}
                />
                <p className="text-slate-300">{issue.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
