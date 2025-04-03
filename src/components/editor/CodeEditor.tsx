"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import DOMPurify from "dompurify";
import { CodeContent } from "@/types";

interface CodeEditorProps {
  content: CodeContent;
  onUpdate: (updatedContent: Partial<CodeContent>) => void;
}

export default function CodeEditor({ content, onUpdate }: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);

  const handleCodeChange = (value: string) => {
    onUpdate({ code: value });
  };

  const handleExplanationChange = (value: string) => {
    // Sanitize HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(value);
    onUpdate({ explanation: sanitizedHtml });
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="font-bold">Code</label>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="brutalist-button text-sm"
            >
              Edit Code
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={content.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="brutalist-border w-full p-3 min-h-[200px] font-mono text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="brutalist-button"
              >
                Done Editing
              </button>
            </div>
          </div>
        ) : (
          <SyntaxHighlighter
            language={content.language}
            style={a11yDark}
            customStyle={{ margin: 0 }}
            className="brutalist-border"
          >
            {content.code}
          </SyntaxHighlighter>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="font-bold">Explanation</label>
          {!isEditingExplanation && (
            <button
              onClick={() => setIsEditingExplanation(true)}
              className="brutalist-button text-sm"
            >
              Edit Explanation
            </button>
          )}
        </div>

        {isEditingExplanation ? (
          <div>
            <textarea
              value={content.explanation}
              onChange={(e) => handleExplanationChange(e.target.value)}
              className="brutalist-border w-full p-3 min-h-[150px] font-mono text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => setIsEditingExplanation(false)}
                className="brutalist-button"
              >
                Done Editing
              </button>
            </div>
            <div className="mt-4 text-sm">
              <p className="font-bold">HTML is supported. Some examples:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <code>&lt;p&gt;Paragraph&lt;/p&gt;</code>
                </li>
                <li>
                  <code>&lt;strong&gt;Bold text&lt;/strong&gt;</code>
                </li>
                <li>
                  <code>&lt;em&gt;Italic text&lt;/em&gt;</code>
                </li>
                <li>
                  <code>
                    &lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;
                  </code>
                </li>
                <li>
                  <code>&lt;code&gt;Inline code&lt;/code&gt;</code>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div
            className="prose max-w-none brutalist-border p-4"
            dangerouslySetInnerHTML={{ __html: content.explanation }}
          />
        )}
      </div>
    </div>
  );
}
