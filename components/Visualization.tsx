"use client";

import { ParsedData, VisualizationType } from "@/lib/type";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface VisualizationProps {
  data: ParsedData;
  vizType?: VisualizationType;
  xAxis?: string;
  yAxis?: string;
}

const COLORS = [
  "#ea6010",
  "#f4aa6e",
  "#db4606",
  "#ee7e34",
  "#b63307",
  "#f8cda6",
];

export default function Visualization({
  data,
  vizType = "bar",
  xAxis,
  yAxis,
}: VisualizationProps) {
  // Prepare data for visualization
  const prepareChartData = () => {
    if (data.rows.length === 0) return [];

    // If specific axes are provided, use those
    if (xAxis && yAxis) {
      return data.rows.map((row, index) => ({
        name: row[xAxis] || `Item ${index + 1}`,
        value: Number(row[yAxis]) || 0,
        x: Number(row[xAxis]) || index,
        y: Number(row[yAxis]) || 0,
      }));
    }

    // Otherwise, use first numeric column
    const numericCol = data.summary.numericColumns[0];
    if (!numericCol) return [];

    return data.rows.map((row, index) => ({
      name: `Item ${index + 1}`,
      value: Number(row[numericCol]) || 0,
    }));
  };

  const chartData = prepareChartData();

  if (chartData.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-slate-400">
          No numeric data available for visualization
        </p>
      </div>
    );
  }

  const renderChart = () => {
    switch (vizType) {
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ea6010"
              strokeWidth={2}
              dot={{ fill: "#ea6010", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Bar dataKey="value" fill="#ea6010" radius={[8, 8, 0, 0]} />
          </BarChart>
        );

      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ea6010"
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea6010" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ea6010" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        );

      case "scatter":
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="x"
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              stroke="#64748b"
              tick={{ fill: "#94a3b8" }}
              tickLine={{ stroke: "#334155" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
            <Scatter data={chartData} fill="#ea6010" />
          </ScatterChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => {
                const name = entry.name || "Unknown";
                const percent = entry.percent || 0;
                return `${name}: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#f1f5f9",
              }}
            />
          </PieChart>
        );

      default:
        return (
          <BarChart data={chartData}>
            <Bar dataKey="value" fill="#ea6010" />
          </BarChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Visualization
        </h3>
        <span className="px-3 py-1 text-xs font-mono bg-slate-800 text-slate-400 rounded-full">
          {vizType}
        </span>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
