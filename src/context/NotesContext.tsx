"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Note {
  id: string;
  postSlug: string;
  text: string;
  highlightedText: string;
  highlightedRange: {
    start: number;
    end: number;
  };
  contextBefore: string;
  contextAfter: string;
  createdAt: string;
  resolved: boolean;
}

interface NotesContextType {
  notes: Note[];
  addNote: (note: Omit<Note, "id" | "createdAt">) => void;
  deleteNote: (id: string) => void;
  resolveNote: (id: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  selectedText: string;
  setSelectedText: (text: string) => void;
  selectedRange: { start: number; end: number } | null;
  setSelectedRange: (range: { start: number; end: number } | null) => void;
  isAddingNote: boolean;
  setIsAddingNote: (isAdding: boolean) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  openNoteById: (id: string) => void;
  handleCancelNote: () => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNotes = localStorage.getItem("blogNotes");
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && notes.length > 0) {
      localStorage.setItem("blogNotes", JSON.stringify(notes));
    }
  }, [notes]);

  const addNote = (note: Omit<Note, "id" | "createdAt">) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
    // Ensure sidebar is open and stays open
    setSidebarOpen(true);
    // Set the new note as active
    setActiveNoteId(newNote.id);
    setSelectedText("");
    setSelectedRange(null);
    setIsAddingNote(false);
  };

  const deleteNote = (id: string) => {
    console.log("Deleting note:", id);
    setNotes((prevNotes) => {
      const newNotes = prevNotes.filter((note) => note.id !== id);
      // Update localStorage with the same key used for loading
      localStorage.setItem("blogNotes", JSON.stringify(newNotes));
      return newNotes;
    });
    // Clear active note if it's the one being deleted
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const resolveNote = (id: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id ? { ...note, resolved: true } : note
      )
    );
  };

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // Reset highlight state ONLY when closing the sidebar (and we were adding a note)
    if (!newState && isAddingNote) {
      handleCancelNote();
    }
  };

  // Function to open sidebar and focus on a specific note
  const openNoteById = (id: string) => {
    setSidebarOpen(true);
    setActiveNoteId(id);

    // Scroll to the note after sidebar animation completes
    setTimeout(() => {
      const noteElement = document.getElementById(`note-${id}`);
      if (noteElement) {
        noteElement.scrollIntoView({ behavior: "smooth", block: "center" });
        noteElement.classList.add("highlight-pulse");

        // Remove highlight pulse after animation
        setTimeout(() => {
          noteElement.classList.remove("highlight-pulse");
        }, 1500);
      }
    }, 300);
  };

  const handleCancelNote = () => {
    setIsAddingNote(false);
    setSelectedText("");
    setSelectedRange(null);
    setActiveNoteId(null);

    // Trigger a reset highlight event
    if (typeof document !== "undefined") {
      const event = new CustomEvent("resetHighlight");
      document.dispatchEvent(event);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        addNote,
        deleteNote,
        resolveNote,
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        selectedText,
        setSelectedText,
        selectedRange,
        setSelectedRange,
        isAddingNote,
        setIsAddingNote,
        activeNoteId,
        setActiveNoteId,
        openNoteById,
        handleCancelNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
