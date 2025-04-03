"use client";

import { useRef, useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { TextContent } from "@/types";
import {
  FiBold,
  FiItalic,
  FiLink,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiCode,
  FiType,
  FiFileText,
} from "react-icons/fi";

interface TextEditorProps {
  content: TextContent;
  onUpdate: (updatedContent: Partial<TextContent>) => void;
}

export default function TextEditor({ content, onUpdate }: TextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const [editorContent, setEditorContent] = useState(content.text);

  // Initialize the editor when starting to edit
  useEffect(() => {
    if (isEditing && editorRef.current) {
      // Set initial content and focus
      if (editorRef.current) {
        editorRef.current.innerHTML = editorContent;
      }
      setTimeout(() => {
        editorRef.current?.focus();
      }, 100);
    }
  }, [isEditing, editorContent]);

  const handleStartEditing = () => {
    setEditorContent(content.text);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(html);
      setEditorContent(sanitizedHtml);
      onUpdate({ text: sanitizedHtml });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Update active state based on current selection
  const updateActiveState = () => {
    if (!editorRef.current) return;

    const newActiveCommands = new Set<string>();

    // Basic formatting
    if (document.queryCommandState("bold")) newActiveCommands.add("bold");
    if (document.queryCommandState("italic")) newActiveCommands.add("italic");

    // Alignment
    if (document.queryCommandState("justifyLeft"))
      newActiveCommands.add("justifyLeft");
    if (document.queryCommandState("justifyCenter"))
      newActiveCommands.add("justifyCenter");
    if (document.queryCommandState("justifyRight"))
      newActiveCommands.add("justifyRight");

    // Lists - check both via command state AND DOM inspection
    if (
      document.queryCommandState("insertUnorderedList") ||
      !!editorRef.current.closest("ul") ||
      !!getSelectionContainerElement()?.closest("ul")
    ) {
      newActiveCommands.add("insertUnorderedList");
    }

    if (
      document.queryCommandState("insertOrderedList") ||
      !!editorRef.current.closest("ol") ||
      !!getSelectionContainerElement()?.closest("ol")
    ) {
      newActiveCommands.add("insertOrderedList");
    }

    // Update the state
    setActiveCommands(newActiveCommands);
  };

  // Helper to get the current selection container element
  const getSelectionContainerElement = () => {
    let range, sel, container;
    if (window.getSelection) {
      sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0);
        container = range.commonAncestorContainer;

        // Check if the container is a text node
        if (container.nodeType === 3) {
          container = container.parentNode;
        }

        return container as HTMLElement;
      }
    }
    return null;
  };

  // Monitor selection changes to update active formatting
  useEffect(() => {
    if (!isEditing) return;

    const checkActiveFormatting = () => {
      updateActiveState();
    };

    // Update on selection change
    document.addEventListener("selectionchange", checkActiveFormatting);

    // Also update when editor content changes
    const observer = new MutationObserver(checkActiveFormatting);

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        subtree: true,
        childList: true,
        characterData: true,
      });
    }

    return () => {
      document.removeEventListener("selectionchange", checkActiveFormatting);
      observer.disconnect();
    };
  }, [isEditing]);

  // Basic formatting commands
  const execBasicCommand = (command: string, value: string = "") => {
    if (!editorRef.current) {
      console.error("Editor reference is not available");
      return;
    }

    // Focus the editor if it's not already focused
    editorRef.current.focus();

    // Execute the command
    document.execCommand(command, false, value);

    // Update active states
    updateActiveState();
  };

  // Toggle list - handles both adding and removing lists
  const toggleList = (listType: "ul" | "ol") => {
    if (!editorRef.current) return;

    // Focus the editor
    editorRef.current.focus();

    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Get the common ancestor of the selection
    let container = range.commonAncestorContainer;
    if (container.nodeType === 3) {
      // Text node
      container = container.parentNode as Node;
    }

    // Check if we're already in a list of the same type
    const inList =
      container.nodeName.toLowerCase() === listType ||
      ((container as HTMLElement).closest &&
        (container as HTMLElement).closest(listType) !== null);

    if (inList) {
      // If already in list, convert to paragraphs
      const listElement =
        container.nodeName.toLowerCase() === listType
          ? container
          : (container as HTMLElement).closest &&
            (container as HTMLElement).closest(listType);

      if (listElement) {
        const fragment = document.createDocumentFragment();

        // Convert each list item to a paragraph
        const listItems = (listElement as HTMLElement).querySelectorAll("li");
        Array.from(listItems).forEach((li) => {
          const p = document.createElement("p");
          p.innerHTML = (li as HTMLElement).innerHTML;
          fragment.appendChild(p);
        });

        // Replace list with paragraphs
        listElement.parentNode?.replaceChild(fragment, listElement);
      }
    } else {
      // If not in a list, create a new list
      const newList = document.createElement(listType);

      // Check if selection spans multiple paragraphs
      const startNode =
        range.startContainer.nodeType === 3
          ? range.startContainer.parentNode
          : range.startContainer;
      const endNode =
        range.endContainer.nodeType === 3
          ? range.endContainer.parentNode
          : range.endContainer;

      if (startNode === endNode || !range.toString().includes("\n")) {
        // Single paragraph or line - wrap in a list item
        let paragraph: Element | Node | null =
          (startNode as HTMLElement).closest?.("p") || startNode;
        if (paragraph) {
          const li = document.createElement("li");
          li.innerHTML = (paragraph as HTMLElement).innerHTML || "";
          newList.appendChild(li);

          // Replace the paragraph with our new list
          if (paragraph.parentNode) {
            paragraph.parentNode.replaceChild(newList, paragraph);
          }
        }
      } else {
        // Multiple paragraphs - convert each to a list item
        const fragment = document.createDocumentFragment();

        // Get all paragraphs in the selection
        const startParagraph = (startNode as HTMLElement).closest
          ? (startNode as HTMLElement).closest("p")
          : null;
        const endParagraph = (endNode as HTMLElement).closest
          ? (endNode as HTMLElement).closest("p")
          : null;

        if (startParagraph && endParagraph) {
          let currentNode: HTMLElement | null = startParagraph;
          const paragraphs: HTMLElement[] = [];

          // Collect all paragraphs between start and end
          while (
            currentNode &&
            currentNode !== endParagraph.nextElementSibling
          ) {
            if (currentNode.nodeName.toLowerCase() === "p") {
              paragraphs.push(currentNode as HTMLElement);
            }
            currentNode =
              (currentNode.nextElementSibling as HTMLElement) || null;
          }

          // Convert paragraphs to list items
          paragraphs.forEach((p) => {
            const li = document.createElement("li");
            li.innerHTML = p.innerHTML || "";
            newList.appendChild(li);
            p.parentNode?.removeChild(p);
          });

          // Insert the new list at the position of the first paragraph
          if (paragraphs.length > 0 && paragraphs[0].parentNode) {
            paragraphs[0].parentNode.insertBefore(newList, paragraphs[0]);
          } else {
            // Fallback - append to editor
            editorRef.current?.appendChild(newList);
          }
        } else {
          // Fallback for when we can't identify paragraphs
          const li = document.createElement("li");
          li.innerHTML = range.toString() || "";
          newList.appendChild(li);
          range.deleteContents();
          range.insertNode(newList);
        }
      }
    }

    // Update active states with a small delay to let DOM changes settle
    setTimeout(updateActiveState, 10);
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "p") {
      execBasicCommand("formatBlock", "<p>");
    } else {
      execBasicCommand("formatBlock", `<${value}>`);
    }
  };

  const handleLinkClick = () => {
    const url = prompt("Enter URL:");
    if (url) {
      execBasicCommand("createLink", url);
    }
  };

  // Button component with active state
  const FormatButton = ({
    command,
    onClick,
    icon,
    title,
  }: {
    command: string;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
  }) => {
    const isActive = activeCommands.has(command);

    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className={`
          p-2 rounded-md transition-colors border
          ${
            isActive
              ? "bg-foreground text-background border-foreground font-medium"
              : "bg-background text-foreground border-border hover:bg-accent/10 active:bg-accent/20"
          }
        `}
        title={title}
        type="button"
        data-active={isActive}
      >
        {icon}
      </button>
    );
  };

  return (
    <div>
      {isEditing ? (
        <div>
          {/* Rich Text Editor Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3 mb-3 bg-background border border-border rounded-md">
            <select
              onChange={handleHeadingChange}
              className="p-1.5 border border-border rounded-md bg-background text-foreground hover:bg-accent/10 focus:bg-accent/10 transition-colors outline-none"
              title="Paragraph/Heading format"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>

            <div className="h-6 w-px bg-border mx-1"></div>

            <FormatButton
              command="bold"
              onClick={() => execBasicCommand("bold")}
              icon={<FiBold />}
              title="Bold"
            />

            <FormatButton
              command="italic"
              onClick={() => execBasicCommand("italic")}
              icon={<FiItalic />}
              title="Italic"
            />

            <FormatButton
              command="link"
              onClick={handleLinkClick}
              icon={<FiLink />}
              title="Insert link"
            />

            <div className="h-6 w-px bg-border mx-1"></div>

            <FormatButton
              command="insertUnorderedList"
              onClick={() => toggleList("ul")}
              icon={<FiList />}
              title="Bullet list"
            />

            <FormatButton
              command="insertOrderedList"
              onClick={() => toggleList("ol")}
              icon={<FiFileText />}
              title="Numbered list"
            />

            <div className="h-6 w-px bg-border mx-1"></div>

            <FormatButton
              command="justifyLeft"
              onClick={() => execBasicCommand("justifyLeft")}
              icon={<FiAlignLeft />}
              title="Align left"
            />

            <FormatButton
              command="justifyCenter"
              onClick={() => execBasicCommand("justifyCenter")}
              icon={<FiAlignCenter />}
              title="Align center"
            />

            <FormatButton
              command="justifyRight"
              onClick={() => execBasicCommand("justifyRight")}
              icon={<FiAlignRight />}
              title="Align right"
            />

            <div className="h-6 w-px bg-border mx-1"></div>

            <FormatButton
              command="formatBlock-pre"
              onClick={() => execBasicCommand("formatBlock", "<pre>")}
              icon={<FiCode />}
              title="Code block"
            />
          </div>

          {/* Editable Content Area */}
          <div
            ref={editorRef}
            contentEditable={true}
            className="border border-border rounded-md w-full p-3 min-h-[200px] prose max-w-none focus:outline-none focus:ring-1 focus:ring-accent/50"
            style={{ overflow: "auto" }}
            onInput={updateActiveState}
            onClick={updateActiveState}
            onMouseDown={(e) => {
              // Prevent click events from propagating when selecting text
              e.stopPropagation();
            }}
          />

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="border border-border rounded-md px-4 py-2 bg-background text-foreground hover:bg-accent/10 active:bg-accent/20 transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="border border-border rounded-md px-4 py-2 bg-foreground text-background hover:opacity-90 active:opacity-80 transition-opacity"
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            className="prose max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: content.text }}
          />
          <button
            onClick={handleStartEditing}
            className="border border-border rounded-md px-4 py-2 bg-background text-foreground hover:bg-accent/10 active:bg-accent/20 transition-colors"
            type="button"
          >
            Edit Text
          </button>
        </div>
      )}
    </div>
  );
}
