"use client";

import { useRef, useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { useNotes, Note } from "@/context/NotesContext";

// Extend Window interface to include our custom function
declare global {
  interface Window {
    openNoteById: (noteId: string) => void;
  }
}

interface HighlightableTextProps {
  content: string;
  postSlug: string;
  className?: string;
}

export default function HighlightableText({
  content,
  postSlug,
  className = "",
}: HighlightableTextProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const [highlightedContent, setHighlightedContent] = useState(content);

  const {
    setSelectedText,
    notes,
    setIsAddingNote,
    selectedText,
    setSelectedRange,
    openNoteById,
    setSidebarOpen,
    isAddingNote,
  } = useNotes();

  // Filter notes for the current post
  const postNotes = notes.filter((note) => note.postSlug === postSlug);

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!isTooltipHovered) {
        setShowTooltip(false);
        setHighlightedContent(content); // Reset highlight
      }
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      if (!isTooltipHovered) {
        setShowTooltip(false);
        setHighlightedContent(content); // Reset highlight
      }
      return;
    }

    // Check if selection is within our content area
    if (
      !contentRef.current?.contains(selection.anchorNode) ||
      !contentRef.current?.contains(selection.focusNode)
    ) {
      return;
    }

    console.log("Selected text:", selectedText);

    // Get the range and position for the tooltip
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Get additional context to uniquely identify this selection
    // Get text before and after the selection to create context
    let contextBefore = "";
    let contextAfter = "";

    try {
      // Try to get some context around the selection
      const clonedRange = range.cloneRange();

      // Get context before selection (up to 20 chars)
      clonedRange.setEnd(range.startContainer, range.startOffset);
      clonedRange.setStart(
        range.startContainer,
        Math.max(0, range.startOffset - 20)
      );
      contextBefore = clonedRange.toString();

      // Get context after selection (up to 20 chars)
      clonedRange.setStart(range.endContainer, range.endOffset);
      // Check node length to avoid "offset larger than node's length" error
      const nodeLength = (range.endContainer.textContent || "").length;
      const safeEndOffset = Math.min(range.endOffset + 20, nodeLength);
      clonedRange.setEnd(range.endContainer, safeEndOffset);
      contextAfter = clonedRange.toString();

      console.log("Context:", {
        before: contextBefore,
        text: selectedText,
        after: contextAfter,
      });

      // Store the selected text with context
      setSelectedText(selectedText);
      // Also store context in the component state
      localStorage.setItem("currentContextBefore", contextBefore);
      localStorage.setItem("currentContextAfter", contextAfter);

      // Create a unique pattern with context to find the exact location
      const uniquePattern = `${contextBefore}${selectedText}${contextAfter}`;

      // Temporarily show the selection with the browser's default styling
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      // Use the unique pattern to find the exact position
      const textContent = tempDiv.textContent || "";
      const fullPattern = contextBefore + selectedText + contextAfter;
      const patternIndex = textContent.indexOf(fullPattern);

      if (patternIndex >= 0) {
        // Now we know where our text is in the full context
        const selectionStartIndex = patternIndex + contextBefore.length;

        // Now we need to find this position in the DOM
        const walker = document.createTreeWalker(
          tempDiv,
          NodeFilter.SHOW_TEXT,
          null
        );

        let currentPos = 0;
        let currentNode = null;
        let startOffset = 0;

        // Find the text node that contains our selection start
        while ((currentNode = walker.nextNode())) {
          const nodeLength = currentNode.textContent?.length || 0;

          if (currentPos + nodeLength > selectionStartIndex) {
            // Found the node containing our selection start
            startOffset = selectionStartIndex - currentPos;
            break;
          }

          currentPos += nodeLength;
        }

        if (currentNode) {
          // Create a highlight for the selected text
          const nodeText = currentNode.textContent || "";

          // Only highlight if we have enough text left in this node
          if (startOffset + selectedText.length <= nodeText.length) {
            const beforeText = nodeText.substring(0, startOffset);
            const afterText = nodeText.substring(
              startOffset + selectedText.length
            );

            // Create text nodes and highlight span
            const beforeNode = document.createTextNode(beforeText);
            const afterNode = document.createTextNode(afterText);
            const highlightSpan = document.createElement("span");
            highlightSpan.className =
              "bg-slate-200 border-b-2 border-slate-400 rounded px-1";
            highlightSpan.textContent = selectedText;

            // Replace the current node with our new nodes
            const parent = currentNode.parentNode;
            if (parent) {
              parent.replaceChild(beforeNode, currentNode);
              parent.insertBefore(highlightSpan, beforeNode.nextSibling);
              parent.insertBefore(afterNode, highlightSpan.nextSibling);

              // Set the highlighted content
              setHighlightedContent(tempDiv.innerHTML);
            }
          } else {
            // Fallback: just use the content as is
            setHighlightedContent(content);
          }
        } else {
          // Node not found, use content as is
          setHighlightedContent(content);
        }
      } else {
        // If pattern not found, use content as is
        setHighlightedContent(content);
      }
    } catch (error) {
      console.error("Error applying highlight:", error);
      setHighlightedContent(content);
    }

    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });

    setShowTooltip(true);
  };

  // Handle clicks outside the selection and tooltip
  const handleDocumentClick = (event: MouseEvent) => {
    // Only handle clicks if we're not in the process of adding a note
    if (!isAddingNote) {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !isTooltipHovered
      ) {
        // Add a small delay to prevent accidental dismissal
        setTimeout(() => {
          setShowTooltip(false);
          setHighlightedContent(content); // Reset highlight
          setSelectedText(""); // Clear selected text
        }, 100);
      }
    }
  };

  // Apply highlighting to notes
  const applyHighlights = (html: string, notes: Note[]): string => {
    // Log for debugging
    console.log("Applying highlights to content for post:", postSlug);
    console.log("Found notes for this post:", notes.length);
    console.log("Notes:", notes);
    console.log("Content being processed:", html.substring(0, 100) + "...");

    if (notes.length === 0) return html;

    let highlightedHtml = html;

    notes.forEach((note) => {
      const highlightClass = note.resolved
        ? "text-white bg-slate-500 border-b-2 border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors rounded px-1 note-highlight"
        : "text-white bg-slate-600 border-b-2 border-slate-900 cursor-pointer hover:bg-slate-900 transition-colors rounded px-1 note-highlight";

      try {
        // Create a temporary div to work with the HTML content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = highlightedHtml;

        // Use context to find the exact right instance
        const textContent = tempDiv.textContent || "";

        // Create a pattern with context to find the exact text
        const pattern =
          note.contextBefore + note.highlightedText + note.contextAfter;
        const patternIndex = textContent.indexOf(pattern);

        if (patternIndex >= 0) {
          // Get the exact position of the highlight text
          const highlightPos = patternIndex + note.contextBefore.length;

          // Find the text node containing this position
          const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT,
            null
          );

          let currentPos = 0;
          let currentNode = null;
          let startOffset = 0;

          // Find the node containing our highlight
          while ((currentNode = walker.nextNode())) {
            const nodeLength = currentNode.textContent?.length || 0;

            if (currentPos + nodeLength > highlightPos) {
              // Found the node containing our highlight
              startOffset = highlightPos - currentPos;
              break;
            }

            currentPos += nodeLength;
          }

          if (currentNode) {
            const nodeText = currentNode.textContent || "";

            // Only highlight if we have room
            if (startOffset + note.highlightedText.length <= nodeText.length) {
              const beforeText = nodeText.substring(0, startOffset);
              const afterText = nodeText.substring(
                startOffset + note.highlightedText.length
              );

              // Create nodes
              const beforeNode = document.createTextNode(beforeText);
              const afterNode = document.createTextNode(afterText);
              const highlightSpan = document.createElement("span");
              highlightSpan.className = highlightClass;
              highlightSpan.setAttribute("data-note-id", note.id);
              highlightSpan.textContent = note.highlightedText;

              // Log for debugging
              console.log(
                `Creating highlight span for note ${note.id} with text: ${note.highlightedText}`
              );

              // Replace the node
              const parent = currentNode.parentNode;
              if (parent) {
                parent.replaceChild(beforeNode, currentNode);
                parent.insertBefore(highlightSpan, beforeNode.nextSibling);
                parent.insertBefore(afterNode, highlightSpan.nextSibling);
              }
            }
          }

          // Update the HTML
          highlightedHtml = tempDiv.innerHTML;
        } else {
          console.log("Pattern not found for note:", note.id);
        }
      } catch (error) {
        console.error("Error applying highlight for note:", note.id, error);
      }
    });

    return highlightedHtml;
  };

  // Add tooltip click handler
  const handleAddNote = () => {
    setIsAddingNote(true);
    setSidebarOpen(true); // Open the sidebar
    setShowTooltip(false);
  };

  // Handle canceling note creation
  const handleCancelNote = () => {
    setIsAddingNote(false);
    setShowTooltip(false);
    setHighlightedContent(content); // Reset highlight
    setSelectedText(""); // Clear selected text
  };

  // Set up document click listener
  useEffect(() => {
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isTooltipHovered]);

  // Set up handler for clicking on highlights using event delegation
  useEffect(() => {
    // Handler for click events on highlighted text
    const handleContentClick = (event: MouseEvent) => {
      // Find the clicked element or any of its parents that has a data-note-id attribute
      let target = event.target as HTMLElement | null;

      // Traverse up the DOM tree looking for elements with data-note-id
      while (target && !target.hasAttribute("data-note-id")) {
        target = target.parentElement;
      }

      // If we found an element with data-note-id, open the corresponding note
      if (target && target.hasAttribute("data-note-id")) {
        const noteId = target.getAttribute("data-note-id");
        if (noteId) {
          console.log("Note highlight clicked:", noteId);
          // Use the openNoteById function to open the sidebar and show the note
          openNoteById(noteId);
          // Prevent default behavior and stop propagation
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    // Add event listener to the content container
    if (contentRef.current) {
      console.log("Adding click listener to content container");
      contentRef.current.addEventListener("click", handleContentClick);
    }

    return () => {
      // Clean up event listener
      if (contentRef.current) {
        contentRef.current.removeEventListener("click", handleContentClick);
      }
    };
  }, [openNoteById]);

  // Make sure the global handler exists for any direct onclick attributes that might be in the HTML
  useEffect(() => {
    // Add a global handler that could be called from onclick attributes
    window.openNoteById = (noteId: string) => {
      console.log("Global openNoteById called with:", noteId);
      openNoteById(noteId);
    };

    return () => {
      // Clean up the global handler
      window.openNoteById = () => {};
    };
  }, [openNoteById]);

  // Prepare the highlighted HTML
  const finalHtml = applyHighlights(highlightedContent, postNotes);

  return (
    <div className="relative">
      <style jsx global>{`
        /* Keep the selection styling for better UX */
        ::selection {
          background-color: rgb(226 232 240); /* bg-slate-200 */
          border-bottom: 2px solid rgb(148 163 184); /* border-slate-400 */
          border-radius: 0.25rem;
          padding: 0 0.25rem;
        }

        /* Make highlighted spans clearly clickable */
        span[data-note-id] {
          cursor: pointer;
        }
      `}</style>
      <div
        ref={contentRef}
        className={`prose max-w-none ${className}`}
        onMouseUp={handleMouseUp}
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {/* Selection tooltip */}
      {showTooltip && selectedText && (
        <div
          ref={tooltipRef}
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x + "px",
            top: tooltipPosition.y + "px",
          }}
          onMouseEnter={() => setIsTooltipHovered(true)}
          onMouseLeave={() => setIsTooltipHovered(false)}
        >
          <button
            onClick={handleAddNote}
            className="flex items-center gap-1 bg-foreground text-background px-3 py-1 rounded-md shadow-md hover:opacity-90 text-sm"
            title="Add note"
          >
            <FiPlus size={16} /> Add Note
          </button>
        </div>
      )}
    </div>
  );
}
