"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  FiPlus,
  FiTrash,
  FiArrowUp,
  FiArrowDown,
  FiSave,
  FiGrid,
  FiAlertCircle,
  FiCheckCircle,
  FiType,
  FiImage,
  FiCode,
  FiBook,
} from "react-icons/fi";
import {
  BlogPost,
  BlogCategory,
  ContentType,
  BlogContent,
  TextContent,
  ImageContent,
  CodeContent,
  Subject,
} from "@/types";
import { saveBlogPost, getSubjects } from "@/lib/supabase";
import TextEditor from "./TextEditor";
import ImageEditor from "./ImageEditor";
import CodeEditor from "./CodeEditor";
import { motion, AnimatePresence } from "framer-motion";

interface EditorPanelProps {
  initialPost?: BlogPost;
  onSave?: (post: BlogPost) => void;
}

const DEFAULT_POST: BlogPost = {
  id: uuidv4(),
  title: "New Blog Post",
  slug: "new-blog-post",
  description: "Add a description for your blog post here.",
  subject_id: "", // This will be populated from available subjects
  category: BlogCategory.FINANCE,
  tags: [],
  content: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  order: 0,
};

export default function EditorPanel({ initialPost, onSave }: EditorPanelProps) {
  const [post, setPost] = useState<BlogPost>(initialPost || DEFAULT_POST);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
    }
  }, [initialPost]);

  // Fetch all subjects when component mounts
  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true);
      try {
        const allSubjects = await getSubjects();
        setSubjects(allSubjects);

        // Filter subjects based on the current category
        const filtered = allSubjects.filter(
          (subject) => subject.category === post.category
        );
        setFilteredSubjects(filtered);

        // If we have a new post and there are filtered subjects, set the first one as default
        if (!initialPost && filtered.length > 0 && !post.subject_id) {
          setPost((prev) => ({ ...prev, subject_id: filtered[0].id }));
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  // Filter subjects when category changes
  useEffect(() => {
    const filtered = subjects.filter(
      (subject) => subject.category === post.category
    );
    setFilteredSubjects(filtered);

    // If the category changed and there are subjects in the new category,
    // but the current subject is not in this category, update the subject_id
    if (filtered.length > 0) {
      const currentSubjectInCategory = filtered.some(
        (subject) => subject.id === post.subject_id
      );

      if (!currentSubjectInCategory) {
        setPost((prev) => ({ ...prev, subject_id: filtered[0].id }));
      }
    }
  }, [post.category, subjects]);

  const handleBasicInfoChange = (field: keyof BlogPost, value: any) => {
    setPost((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tagsArray = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setPost((prev) => ({ ...prev, tags: tagsArray }));
  };

  const addContentBlock = (type: ContentType) => {
    let newBlock: BlogContent;

    switch (type) {
      case ContentType.TEXT:
        newBlock = {
          type: ContentType.TEXT,
          id: uuidv4(),
          text: "<p>Enter your text here...</p>",
          gridColumn: "col-span-2",
        };
        break;
      case ContentType.IMAGE:
        newBlock = {
          type: ContentType.IMAGE,
          id: uuidv4(),
          src: "/placeholder.jpg",
          alt: "Image description",
          caption: "Image caption",
          gridColumn: "col-span-1",
        };
        break;
      case ContentType.CODE:
        newBlock = {
          type: ContentType.CODE,
          id: uuidv4(),
          code: '# Example Python code\nprint("Hello, world!")',
          language: "python",
          explanation:
            '<p>This is a simple Python code that prints "Hello, world!" to the console.</p>',
          gridColumn: "col-span-2",
        };
        break;
      default:
        return;
    }

    setPost((prev) => ({
      ...prev,
      content: [...prev.content, newBlock],
    }));
  };

  const updateContentBlock = (
    id: string,
    updatedBlock: Partial<BlogContent>
  ) => {
    setPost((prev) => {
      const updatedContent = prev.content.map((block) =>
        block.id === id ? ({ ...block, ...updatedBlock } as BlogContent) : block
      );
      return {
        ...prev,
        content: updatedContent,
      };
    });
  };

  const removeContentBlock = (id: string) => {
    setPost((prev) => ({
      ...prev,
      content: prev.content.filter((block) => block.id !== id),
    }));
  };

  const moveContentBlock = (id: string, direction: "up" | "down") => {
    const contentCopy = [...post.content];
    const index = contentCopy.findIndex((block) => block.id === id);

    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === contentCopy.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const [movedBlock] = contentCopy.splice(index, 1);
    contentCopy.splice(newIndex, 0, movedBlock);

    setPost((prev) => ({ ...prev, content: contentCopy }));
  };

  const handleSavePost = async () => {
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    // Validate subject selection
    if (!post.subject_id) {
      setErrorMessage("Please select a subject for this post.");
      setSaving(false);
      return;
    }

    try {
      // Make sure slug is URL friendly
      const safeSlug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const updatedPost = {
        ...post,
        slug: safeSlug,
        updatedAt: new Date().toISOString(),
      };

      const savedPost = await saveBlogPost(updatedPost);

      if (savedPost) {
        setPost(savedPost);
        setSuccessMessage("Post saved successfully!");
        if (onSave) onSave(savedPost);
      } else {
        setErrorMessage("Error saving post. Please try again.");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      setErrorMessage(
        `Error saving post: ${
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
        <h1 className="text-2xl font-bold mb-6 pb-2 border-b-3 border-border">
          {initialPost ? "Edit Post" : "Create New Post"}
        </h1>

        {/* Basic Info Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="editor-field">
            <label className="block mb-2 font-bold">Title</label>
            <input
              type="text"
              value={post.title}
              onChange={(e) => handleBasicInfoChange("title", e.target.value)}
              className="brutalist-border w-full p-3"
              placeholder="Enter post title"
            />
          </div>

          <div className="editor-field">
            <label className="block mb-2 font-bold">Category</label>
            <select
              value={post.category}
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

          <div className="editor-field">
            <label className="block mb-2 font-bold">
              <span className="flex items-center gap-1">
                <FiBook /> Subject
              </span>
            </label>
            <select
              value={post.subject_id}
              onChange={(e) =>
                handleBasicInfoChange("subject_id", e.target.value)
              }
              className="brutalist-border w-full p-3"
              disabled={loading || filteredSubjects.length === 0}
            >
              {loading ? (
                <option value="">Loading subjects...</option>
              ) : filteredSubjects.length === 0 ? (
                <option value="">
                  No subjects available for this category
                </option>
              ) : (
                <>
                  <option value="">-- Select a subject --</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.title}
                    </option>
                  ))}
                </>
              )}
            </select>
            {filteredSubjects.length === 0 && !loading && (
              <p className="text-sm text-red-500 mt-1">
                Please create a subject for this category in the Supabase
                dashboard first.
              </p>
            )}
            {post.subject_id && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p className="mb-1">
                  <strong>This post belongs to:</strong>{" "}
                  {filteredSubjects.find((s) => s.id === post.subject_id)
                    ?.title || "Unknown subject"}
                </p>
                <p className="text-muted-foreground">
                  This post will appear under this subject in the category{" "}
                  {post.category}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2 editor-field">
            <label className="block mb-2 font-bold">Description</label>
            <textarea
              value={post.description}
              onChange={(e) =>
                handleBasicInfoChange("description", e.target.value)
              }
              className="brutalist-border w-full p-3 h-24"
              placeholder="Brief description of your post"
            />
          </div>

          <div className="md:col-span-2 editor-field">
            <label className="block mb-2 font-bold">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={post.tags.join(", ")}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="brutalist-border w-full p-3"
              placeholder="finance, machine learning, statistics"
            />
          </div>

          {initialPost && (
            <div className="editor-field">
              <label className="block mb-2 font-bold">Order</label>
              <input
                type="number"
                value={post.order || 0}
                onChange={(e) =>
                  handleBasicInfoChange("order", parseInt(e.target.value))
                }
                className="brutalist-border w-full p-3"
                placeholder="Display order (lower numbers shown first)"
              />
            </div>
          )}
        </div>

        {/* Content Blocks Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FiGrid /> Content Blocks
            </h2>

            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addContentBlock(ContentType.TEXT)}
                className="brutalist-button flex items-center gap-1"
              >
                <FiPlus /> Text
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addContentBlock(ContentType.IMAGE)}
                className="brutalist-button flex items-center gap-1"
              >
                <FiPlus /> Image
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addContentBlock(ContentType.CODE)}
                className="brutalist-button flex items-center gap-1"
              >
                <FiPlus /> Code
              </motion.button>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence>
              {post.content.map((block, index) => (
                <motion.div
                  key={block.id}
                  className="brutalist-box p-4 content-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-base mb-0 flex items-center gap-2">
                      {block.type === ContentType.TEXT && <FiType />}
                      {block.type === ContentType.IMAGE && <FiImage />}
                      {block.type === ContentType.CODE && <FiCode />}
                      {block.type === ContentType.TEXT
                        ? "Text Block"
                        : block.type === ContentType.IMAGE
                        ? "Image Block"
                        : "Code Block"}
                    </h3>
                    <div className="flex gap-1 block-controls">
                      <select
                        value={block.gridColumn || "col-span-2"}
                        onChange={(e) =>
                          updateContentBlock(block.id, {
                            gridColumn: e.target.value,
                          })
                        }
                        className="brutalist-border px-2 py-1 text-sm bg-background"
                      >
                        <option value="col-span-1">Half-width</option>
                        <option value="col-span-2">Full-width</option>
                      </select>

                      <button
                        onClick={() => moveContentBlock(block.id, "up")}
                        disabled={index === 0}
                        className={`brutalist-button p-1 ${
                          index === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        aria-label="Move up"
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        onClick={() => moveContentBlock(block.id, "down")}
                        disabled={index === post.content.length - 1}
                        className={`brutalist-button p-1 ${
                          index === post.content.length - 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        aria-label="Move down"
                      >
                        <FiArrowDown />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeContentBlock(block.id)}
                        className="brutalist-button p-1 bg-red-100 dark:bg-red-900"
                        aria-label="Remove block"
                      >
                        <FiTrash />
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-6">
                    {block.type === ContentType.TEXT && (
                      <TextEditor
                        content={block as TextContent}
                        onUpdate={(updatedBlock) =>
                          updateContentBlock(block.id, updatedBlock)
                        }
                      />
                    )}

                    {block.type === ContentType.IMAGE && (
                      <ImageEditor
                        content={block as ImageContent}
                        onUpdate={(updatedBlock) =>
                          updateContentBlock(block.id, updatedBlock)
                        }
                      />
                    )}

                    {block.type === ContentType.CODE && (
                      <CodeEditor
                        content={block as CodeContent}
                        onUpdate={(updatedBlock) =>
                          updateContentBlock(block.id, updatedBlock)
                        }
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {post.content.length === 0 && (
              <div className="text-center py-12 brutalist-border bg-muted">
                <p className="mb-4 text-lg font-semibold">
                  No content blocks yet!
                </p>
                <p className="text-muted-foreground mb-6">
                  Click one of the buttons above to add your first content
                  block.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addContentBlock(ContentType.TEXT)}
                  className="brutalist-button inline-flex items-center gap-1"
                >
                  <FiPlus /> Add Text Block
                </motion.button>
              </div>
            )}
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
            onClick={handleSavePost}
            disabled={saving}
            className="brutalist-button flex items-center gap-2 px-6 py-3 text-lg"
          >
            <FiSave /> {saving ? "Saving..." : "Save Post"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
