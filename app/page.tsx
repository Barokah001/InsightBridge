"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Brain, Database } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DataSummary from "@/components/DataSummary";
import QuestionInput from "@/components/QuestionInput";
import InsightDisplay from "@/components/InsightDisplay";
import Visualization from "@/components/Visualization";
import { detectQualityIssues } from "@/lib/dataParser";
import { ParsedData, Question } from "@/lib/type";
import { queryAI } from "@/validation/aiServiceGemini";


export default function Home() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Question[]>([]);

  const handleDataParsed = (parsedData: ParsedData) => {
    setData(parsedData);
    setCurrentQuestion(null);
    setHistory([]);
  };

  const handleQuestionSubmit = async (questionText: string) => {
    if (!data) return;

    setIsLoading(true);
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: questionText,
      timestamp: new Date(),
    };

    setCurrentQuestion(newQuestion);

    try {
      const insight = await queryAI(questionText, data);
      const updatedQuestion = { ...newQuestion, response: insight };
      setCurrentQuestion(updatedQuestion);
      setHistory((prev) => [...prev, updatedQuestion]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const qualityIssues = data ? detectQualityIssues(data) : [];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800/50 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full" />
                <div className="relative p-2 bg-slate-900 rounded-xl border border-primary-600">
                  <Brain className="w-6 h-6 text-primary-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold gradient-text">
                  Insight Engine
                </h1>
                <p className="text-sm text-slate-400">
                  AI-Resilient Analytics Dashboard
                </p>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          {!data ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 mb-12"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-sm text-primary-400 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Transform data into trustworthy insights</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-100 leading-tight">
                  Upload your data.
                  <br />
                  <span className="gradient-text">Ask anything.</span>
                </h2>

                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Get AI-powered insights with confidence scores, visual
                  breakdowns, and transparency you can trust.
                </p>
              </motion.div>

              <FileUpload onDataParsed={handleDataParsed} />

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-3 gap-4 mt-16"
              >
                {[
                  {
                    icon: Database,
                    title: "Smart Parsing",
                    description:
                      "Automatically detect types, quality issues, and patterns",
                  },
                  {
                    icon: Brain,
                    title: "AI-Powered",
                    description:
                      "Ask questions in plain English, get structured insights",
                  },
                  {
                    icon: Sparkles,
                    title: "Confidence Scores",
                    description: "Know when to trust AI and when to dig deeper",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="glass rounded-xl p-6 space-y-3 group hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="p-3 bg-primary-500/10 rounded-lg w-fit group-hover:bg-primary-500/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary-500" />
                    </div>
                    <h3 className="font-display font-semibold text-slate-200">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Data Summary */}
              <DataSummary data={data} qualityIssues={qualityIssues} />

              {/* Question Input */}
              <QuestionInput
                onSubmit={handleQuestionSubmit}
                isLoading={isLoading}
              />

              {/* Current Insight */}
              {currentQuestion?.response && (
                <div className="space-y-6">
                  <InsightDisplay
                    insight={currentQuestion.response}
                    question={currentQuestion.text}
                  />

                  {/* Visualization */}
                  {currentQuestion.response.suggestedViz && (
                    <Visualization
                      data={data}
                      vizType={currentQuestion.response.suggestedViz}
                    />
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoading && !currentQuestion?.response && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-12 text-center space-y-4"
                >
                  <div className="inline-block p-4 bg-primary-500/10 rounded-full">
                    <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-slate-400">Analyzing your data...</p>
                </motion.div>
              )}

              {/* History */}
              {history.length > 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Previous Questions
                  </h3>
                  <div className="space-y-3">
                    {history
                      .slice(0, -1)
                      .reverse()
                      .map((q) => (
                        <div
                          key={q.id}
                          className="glass rounded-lg p-4 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <p className="text-sm text-slate-300">{q.text}</p>
                          {q.response && (
                            <p className="text-xs text-slate-500 mt-1">
                              Confidence: {q.response.confidence}%
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
