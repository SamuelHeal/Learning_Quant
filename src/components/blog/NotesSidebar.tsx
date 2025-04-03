"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiTrash,
  FiCheck,
  FiFileText,
} from "react-icons/fi";
import { useNotes, Note } from "@/context/NotesContext";
import { formatDistanceToNow } from "date-fns";

export default function NotesSidebar({ postSlug }: { postSlug: string }) {
  const {
    notes,
    sidebarOpen,
    toggleSidebar,
    selectedText,
    deleteNote,
    resolveNote,
    addNote,
    isAddingNote,
    setIsAddingNote,
    activeNoteId,
    handleCancelNote,
  } = useNotes();

  const [noteText, setNoteText] = useState("");

  // Filter notes for the current post
  const postNotes = notes.filter((note) => note.postSlug === postSlug);

  // Debug information
  console.log("NotesSidebar for postSlug:", postSlug);
  console.log("All notes:", notes);
  console.log("Filtered notes for this post:", postNotes);

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedText || !noteText) return;

    addNote({
      postSlug,
      text: noteText,
      highlightedText: selectedText,
      highlightedRange: {
        start: 0,
        end: 0,
      }, // This will be set properly in the highlighting component
      contextBefore: localStorage.getItem("currentContextBefore") || "",
      contextAfter: localStorage.getItem("currentContextAfter") || "",
      resolved: false,
    });

    setNoteText("");
  };

  return (
    <>
      {/* Styles for the highlight pulse animation */}
      <style jsx global>{`
        @keyframes highlight-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(var(--accent-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--accent-rgb), 0);
          }
        }
        .highlight-pulse {
          animation: highlight-pulse 1.5s ease-out;
        }

        @keyframes button-pulse {
          0% {
            box-shadow: var(--shadow);
          }
          50% {
            box-shadow: 8px 8px 0px 0px rgba(var(--accent-rgb), 0.7);
          }
          100% {
            box-shadow: var(--shadow);
          }
        }
        .button-pulse {
          animation: button-pulse 2s infinite;
        }
      `}</style>

      {/* Enhanced Toggle button */}
      <motion.button
        onClick={toggleSidebar}
        whileHover={{ x: sidebarOpen ? 0 : -5 }}
        className={`fixed right-0 top-1/2 transform -translate-y-1/2 z-60 brutalist-border ${
          sidebarOpen
            ? "bg-foreground text-background"
            : "bg-accent text-accent-foreground button-pulse"
        } px-2 py-3 rounded-l-md transition-colors shadow-brutal flex items-center gap-2`}
        aria-label={sidebarOpen ? "Close notes" : "Open notes"}
      >
        <FiFileText size={18} />

        {sidebarOpen ? <FiChevronRight /> : <FiChevronLeft />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed right-0 top-[81px] bottom-0 w-80 z-60 bg-background border-l-3 border-foreground p-4 overflow-y-auto shadow-brutal"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Notes</h3>
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-accent/10 rounded-md"
                aria-label="Close notes"
              >
                <FiX />
              </button>
            </div>

            {/* Add note form */}
            {isAddingNote && selectedText && (
              <div className="mb-6 border-3 border-foreground p-3 rounded-md">
                <div className="text-sm mb-2">
                  <span className="font-bold">Selected text:</span>
                </div>
                <div className="bg-accent/10 p-2 rounded-md mb-3 text-sm italic">
                  "{selectedText}"
                </div>
                <form onSubmit={handleSubmitNote}>
                  <div className="mb-3">
                    <label
                      htmlFor="note-text"
                      className="block text-sm font-bold mb-1"
                    >
                      Your note:
                    </label>
                    <textarea
                      id="note-text"
                      className="w-full p-2 border-2 border-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelNote}
                      className="px-3 py-1 border-2 border-foreground rounded-md hover:bg-accent/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-foreground text-background rounded-md hover:opacity-90"
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notes list */}
            {postNotes.length > 0 ? (
              <div className="space-y-4">
                {postNotes.map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    onDelete={deleteNote}
                    onResolve={resolveNote}
                    isActive={activeNoteId === note.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <p>No notes yet for this post.</p>
                <p className="text-sm mt-2">
                  Select text in the article to add notes.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NoteItem({
  note,
  onDelete,
  onResolve,
  isActive,
}: {
  note: Note;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  isActive: boolean;
}) {
  // Add function to handle click on the entire note item
  const handleNoteClick = () => {
    // We want to highlight the note but not toggle resolved status
    // This effectively just makes the note active
    document.getElementById(`note-${note.id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div
      id={`note-${note.id}`}
      onClick={handleNoteClick}
      className={`border-2 rounded-md p-3 transition-all cursor-pointer ${
        note.resolved ? "border-accent/30 opacity-60" : "border-accent"
      } ${isActive ? "border-2 ring-2 ring-accent" : ""}`}
    >
      <div className="text-sm mb-2">
        <span className="font-bold">Highlighted:</span>
      </div>
      <div className="bg-accent/10 p-2 rounded-md mb-3 text-sm italic">
        "{note.highlightedText}"
      </div>
      <div className="text-sm mb-1">
        <span className="font-bold">Note:</span>
      </div>
      <p className="text-sm mb-3">{note.text}</p>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>
          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
        </span>
        <div className="flex gap-2">
          {!note.resolved && (
            <button
              onClick={() => onResolve(note.id)}
              className="p-1 hover:bg-accent/10 rounded-full"
              aria-label="Resolve note"
              title="Resolve"
            >
              <FiCheck />
            </button>
          )}
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 hover:bg-accent/10 rounded-full text-red-500"
            aria-label="Delete note"
            title="Delete"
          >
            <FiTrash />
          </button>
        </div>
      </div>
      {note.resolved && (
        <div className="mt-2 text-xs font-medium text-green-600">Resolved</div>
      )}
    </div>
  );
}
