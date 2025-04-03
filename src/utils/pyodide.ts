// Define Pyodide type interface
export interface PyodideInterface {
  globals: any;
  runPython(code: string, options?: any): any;
  runPythonAsync(code: string, options?: any): Promise<any>;
  setStdout(options: { write: (output: string) => number }): void;
  setStderr(options: { write: (output: string) => number }): void;
}

// We'll store the Pyodide instance once it's loaded
let pyodideInstance: any = null;
let isLoading = false;
let loadingPromise: Promise<any> | null = null;

// Create a function to load the Pyodide script
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

/**
 * Initializes and loads Pyodide
 */
export async function initPyodide(): Promise<PyodideInterface> {
  // Only run in browser environment
  if (typeof window === "undefined") {
    throw new Error("Pyodide can only be loaded in a browser environment");
  }

  // If we already have an instance, return it
  if (pyodideInstance) {
    return pyodideInstance;
  }

  // If we're already loading, return the loading promise
  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  // Start loading Pyodide
  isLoading = true;

  try {
    // Load the Pyodide script from CDN
    const pyodideUrl =
      "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
    await loadScript(pyodideUrl);

    // The script adds loadPyodide to the window object
    const loadPyodide = (window as any).loadPyodide;

    if (!loadPyodide) {
      throw new Error("Failed to load Pyodide: loadPyodide function not found");
    }

    // Load the Pyodide wasm and standard library
    loadingPromise = loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
      packages: ["scikit-learn", "pandas"],
    });

    pyodideInstance = await loadingPromise;
    console.log("Pyodide loaded successfully");
    return pyodideInstance;
  } catch (error) {
    console.error("Failed to load Pyodide:", error);
    throw error;
  } finally {
    isLoading = false;
    loadingPromise = null;
  }
}

/**
 * Executes Python code using Pyodide
 */
export async function executePythonCode(code: string): Promise<string> {
  if (typeof window === "undefined") {
    return "Python code execution is only available in the browser.";
  }

  try {
    // Initialize Pyodide if not already initialized
    const pyodide = await initPyodide();

    // Set up StringIO for stdout capture
    await pyodide.runPythonAsync(`
      import sys
      import io
      
      # Save the original stdout
      _original_stdout = sys.stdout
      
      # Create a StringIO object for capturing
      sys.stdout = io.StringIO()
    `);

    // Set up HTTP support for network requests
    try {
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install('pyodide-http')
        # Ensure pandas is available
        try:
            import pandas as pd
        except ModuleNotFoundError:
            await micropip.install('pandas')
        import pyodide_http
        pyodide_http.patch_all()
      `);
    } catch (httpError) {
      console.warn("Failed to setup pyodide-http:", httpError);
    }

    try {
      // Create a new scope to avoid variable conflicts
      const namespace = pyodide.globals.get("dict")();

      // Run the code and capture the result
      const result = await pyodide.runPythonAsync(code, { globals: namespace });

      // Get the stdout content
      const stdout = pyodide.runPython(`
        output = sys.stdout.getvalue()
        sys.stdout.close()
        output
      `);

      // Format the output
      let output = stdout ? stdout : "";

      // If there's a result that's not None, add it to the output
      if (
        result &&
        result.toString() !== "undefined" &&
        result.toString() !== "None"
      ) {
        if (output) {
          output += "\n";
        }
        output += `Result: ${result.toString()}`;
      }

      namespace.destroy();
      return output;
    } finally {
      // Always restore the original stdout
      pyodide.runPython("sys.stdout = _original_stdout");
    }
  } catch (error) {
    console.error("Error executing Python code:", error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
