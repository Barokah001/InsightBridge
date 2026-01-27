"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What trends can you identify in this data?",
  "Are there any correlations between variables?",
  "What are the key patterns I should know about?",
  "Show me the distribution of values",
  "Are there any outliers or anomalies?",
];

export default function QuestionInput({
  onSubmit,
  isLoading,
}: QuestionInputProps) {
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim());
      setQuestion("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      onSubmit(suggestion);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Main Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative glass rounded-2xl overflow-hidden border-2 border-slate-800 focus-within:border-primary-600 transition-colors">
          <div className="absolute top-4 left-5">
            <Sparkles className="w-5 h-5 text-primary-500" />
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your data..."
            disabled={isLoading}
            rows={3}
            className="
              w-full pl-14 pr-14 py-4 
              bg-transparent text-slate-100 placeholder:text-slate-500
              resize-none outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="
              absolute bottom-3 right-3 
              p-2.5 bg-primary-600 rounded-xl
              text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-primary-500 active:scale-95
              transition-all duration-200
              group
            "
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </button>
        </div>
      </form>

      {/* Suggested Questions */}
      <div className="space-y-3">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Suggested Questions
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="
                px-3 py-2 text-sm 
                bg-slate-800/50 hover:bg-slate-800 
                text-slate-300 hover:text-primary-400
                rounded-lg border border-slate-700 hover:border-primary-600
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
