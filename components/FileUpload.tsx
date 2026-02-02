"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ParsedData } from "@/lib/type";
import {
  parseCSV,
  parseJSON,
  parseExcel,
  parsePDF,
  parseImage,
} from "@/lib/fileParser";

interface FileUploadProps {
  onDataParsed: (data: ParsedData) => void;
}

export default function FileUpload({ onDataParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsProcessing(true);

      // Set appropriate message based on file type
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".pdf")) {
        setProcessingMessage("Extracting data from PDF...");
      } else if (fileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
        setProcessingMessage("Performing OCR on image... (may take 30s)");
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        setProcessingMessage("Reading Excel file...");
      } else if (fileName.endsWith(".csv")) {
        setProcessingMessage("Parsing CSV...");
      } else if (fileName.endsWith(".json")) {
        setProcessingMessage("Parsing JSON...");
      } else {
        setProcessingMessage("Processing file...");
      }

      try {
        // Route to appropriate parser
        let data: ParsedData;

        if (fileName.endsWith(".csv")) {
          data = await parseCSV(file);
        } else if (fileName.endsWith(".json")) {
          const text = await file.text();
          data = parseJSON(text);
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
          data = await parseExcel(file);
        } else if (fileName.endsWith(".pdf")) {
          data = await parsePDF(file);
        } else if (fileName.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
          data = await parseImage(file);
        } else {
          throw new Error(
            "Unsupported file type. Please upload CSV, JSON, Excel, PDF, or Image files.",
          );
        }

        onDataParsed(data);
      } catch (err) {
        console.error("File parsing error:", err);
        setError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setIsProcessing(false);
        setProcessingMessage("");
      }
    },
    [onDataParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <label
          htmlFor="file-upload"
          className={`
            relative block w-full p-12 border-2 border-dashed rounded-2xl
            transition-all duration-300 cursor-pointer group
            ${
              isDragging
                ? "border-primary-500 bg-primary-500/5 scale-[1.02]"
                : "border-slate-700 hover:border-primary-600 hover:bg-slate-900/40"
            }
            ${isProcessing ? "pointer-events-none opacity-50" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            accept=".csv,.json,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.webp"
            onChange={handleFileInput}
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
              <div className="relative p-4 bg-slate-900 rounded-full border border-slate-800 group-hover:border-primary-600 transition-colors">
                {isProcessing ? (
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-primary-500" />
                )}
              </div>
            </motion.div>

            <div className="text-center space-y-2">
              <p className="text-lg font-display font-semibold text-slate-200">
                {isProcessing ? processingMessage : "Upload your data"}
              </p>
              <p className="text-sm text-slate-400">
                {isProcessing
                  ? "Please wait..."
                  : "Drag & drop or click to select"}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                CSV, Excel, PDF, JSON, or Images
              </p>
            </div>

            {!isProcessing && (
              <div className="flex gap-2 text-xs text-slate-500">
                <FileText className="w-4 h-4" />
                <span>Max 10MB</span>
              </div>
            )}
          </div>
        </label>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Upload failed</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
