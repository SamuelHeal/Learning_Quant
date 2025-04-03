"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import { FiCode, FiPlay, FiInfo, FiX } from "react-icons/fi";
import { TextContent, ImageContent, CodeContent, ContentType } from "@/types";
import { executePythonCode } from "@/utils/pyodide";
import HighlightableText from "./HighlightableText";

// Text component
export function TextBlock({ content }: { content: TextContent }) {
  // Debug the content to see if postSlug is available
  console.log("TextBlock content:", content);

  // Extract post slug from content or use unknown
  const postSlug = content.postSlug || "unknown";
  console.log("Using postSlug:", postSlug);

  return (
    <div
      className={`${content.gridColumn ? content.gridColumn : "col-span-2"}`}
    >
      <HighlightableText
        content={content.text}
        postSlug={postSlug}
        className="prose prose-lg"
      />
    </div>
  );
}

// Image component
export function ImageBlock({ content }: { content: ImageContent }) {
  return (
    <div
      className={`${content.gridColumn ? content.gridColumn : "col-span-1"}`}
    >
      <figure className="brutalist-box p-4">
        <div className="relative aspect-video">
          <Image
            src={content.src}
            alt={content.alt}
            fill
            className="object-cover"
          />
        </div>
        {content.caption && (
          <figcaption className="mt-2 text-sm text-center">
            {content.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
}

// Code component with explanation modal
export function CodeBlock({ content }: { content: CodeContent }) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);

  // Execute Python code using Pyodide
  const executeCode = async () => {
    // Guard against server-side execution
    if (typeof window === "undefined") {
      return;
    }

    if (content.language !== "python") {
      setOutput("Only Python code execution is supported at this time.");
      return;
    }

    setIsRunning(true);
    setOutput("Running code...");

    try {
      // Execute the code using our Pyodide utility
      const result = await executePythonCode(content.code);
      setOutput(result);
    } catch (error) {
      setOutput(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className={`${content.gridColumn ? content.gridColumn : "col-span-2"}`}
    >
      <div className="brutalist-box overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-accent text-secondary">
          <div className="font-mono text-sm">{content.language}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExplanation(true)}
              className="p-1 hover:bg-black/20 rounded"
              aria-label="Show explanation"
            >
              <FiInfo />
            </button>
            {content.language === "python" && (
              <button
                onClick={executeCode}
                disabled={isRunning}
                className={`p-1 hover:bg-black/20 rounded flex items-center ${
                  isRunning ? "opacity-50" : ""
                }`}
                aria-label="Run code"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1"></div>
                    Running...
                  </>
                ) : (
                  <FiPlay />
                )}
              </button>
            )}
          </div>
        </div>

        <SyntaxHighlighter
          language={content.language}
          style={a11yDark}
          customStyle={{ margin: 0, borderRadius: 0 }}
        >
          {content.code}
        </SyntaxHighlighter>

        {output && (
          <div className="border-t-3 border-foreground p-4 bg-foreground/5 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[300px]">
            {output}
          </div>
        )}
      </div>

      {/* Explanation modal */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 flex items-center justify-center p-4 z-50"
            onClick={() => setShowExplanation(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background brutalist-box p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Code Explanation</h3>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="p-2"
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: content.explanation }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main component that renders the appropriate block based on type
export default function BlogContentBlock({
  content,
}: {
  content: TextContent | ImageContent | CodeContent;
}) {
  switch (content.type) {
    case ContentType.TEXT:
      return <TextBlock content={content} />;
    case ContentType.IMAGE:
      return <ImageBlock content={content} />;
    case ContentType.CODE:
      return <CodeBlock content={content} />;
    default:
      return null;
  }
}
