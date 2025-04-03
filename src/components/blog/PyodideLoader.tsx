"use client";

import { useEffect, useState } from "react";
import { initPyodide } from "@/utils/pyodide";

export default function PyodideLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    async function loadPyodide() {
      if (isLoaded || isLoading) return;

      setIsLoading(true);
      try {
        await initPyodide();
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setError(
          `Failed to load Python runtime: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPyodide();
  }, [isLoaded, isLoading]);

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-destructive text-destructive-foreground rounded-md shadow-lg max-w-md">
        <p className="font-bold mb-2">Python Runtime Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading && !isLoaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 p-4 bg-accent text-accent-foreground rounded-md shadow-lg">
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
          <p>Loading Python runtime...</p>
        </div>
      </div>
    );
  }

  return null;
}
