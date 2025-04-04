"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { FiSave, FiAlertCircle, FiCheckCircle, FiBook } from "react-icons/fi";
import { Subject, BlogCategory } from "@/types";
import { saveSubject } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectEditorPanelProps {
  initialSubject?: Subject;
  onSave?: (subject: Subject) => void;
}

const DEFAULT_SUBJECT: Subject = {
  id: uuidv4(),
  title: "New Subject",
  slug: "new-subject",
  description: "Add a description for your subject here.",
  category: BlogCategory.FINANCE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  order: 0,
};

export default function SubjectEditorPanel({
  initialSubject,
  onSave,
}: SubjectEditorPanelProps) {
  const [subject, setSubject] = useState<Subject>(
    initialSubject || DEFAULT_SUBJECT
  );
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  const handleBasicInfoChange = (field: keyof Subject, value: any) => {
    setSubject((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSubject = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Make sure slug is URL friendly
      const safeSlug = subject.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const updatedSubject = {
        ...subject,
        slug: safeSlug,
        updatedAt: new Date().toISOString(),
      };

      const savedSubject = await saveSubject(updatedSubject);

      if (savedSubject) {
        setSubject(savedSubject);
        setSuccessMessage("Subject saved successfully!");
        if (onSave) onSave(savedSubject);
      } else {
        setErrorMessage("Error saving subject. Please try again.");
      }
    } catch (error) {
      console.error("Error saving subject:", error);
      setErrorMessage(
        `Error saving subject: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setSaving(false);

      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  return (
    <div className="brutalist-box p-6 mb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-6 pb-2 border-b-3 border-border flex items-center gap-2">
          <FiBook /> {initialSubject ? "Edit Subject" : "Create New Subject"}
        </h1>

        {/* Basic Info Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="editor-field">
            <label className="block mb-2 font-bold">Title</label>
            <input
              type="text"
              value={subject.title}
              onChange={(e) => handleBasicInfoChange("title", e.target.value)}
              className="brutalist-border w-full p-3"
              placeholder="Enter subject title"
            />
          </div>

          <div className="editor-field">
            <label className="block mb-2 font-bold">Category</label>
            <select
              value={subject.category}
              onChange={(e) =>
                handleBasicInfoChange("category", e.target.value)
              }
              className="brutalist-border w-full p-3"
            >
              {Object.values(BlogCategory).map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 editor-field">
            <label className="block mb-2 font-bold">Description</label>
            <textarea
              value={subject.description}
              onChange={(e) =>
                handleBasicInfoChange("description", e.target.value)
              }
              className="brutalist-border w-full p-3 h-24"
              placeholder="Brief description of your subject"
            />
          </div>

          <div className="editor-field">
            <label className="block mb-2 font-bold">Order</label>
            <input
              type="number"
              value={subject.order || 0}
              onChange={(e) =>
                handleBasicInfoChange("order", parseInt(e.target.value))
              }
              className="brutalist-border w-full p-3"
              placeholder="Display order (lower numbers shown first)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Subjects with lower order numbers will be displayed first
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex flex-wrap justify-end items-center gap-4 editor-actions">
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-red-500 flex items-center gap-2"
              >
                <FiAlertCircle /> {errorMessage}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="text-green-500 flex items-center gap-2"
              >
                <FiCheckCircle /> {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveSubject}
            disabled={saving}
            className="brutalist-button flex items-center gap-2 px-6 py-3 text-lg"
          >
            <FiSave /> {saving ? "Saving..." : "Save Subject"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
