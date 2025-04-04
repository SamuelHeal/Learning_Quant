"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiList,
  FiTrash,
  FiLock,
  FiBook,
  FiFileText,
} from "react-icons/fi";
import EditorPanel from "@/components/editor/EditorPanel";
import {
  getBlogPostBySlug,
  getBlogPosts,
  updateBlogPostOrder,
  deleteBlogPost,
  getSubjects,
  getSubjectBySlug,
  saveSubject,
  deleteSubject,
  updateSubjectOrder,
} from "@/lib/supabase";
import { BlogPost, BlogCategory, Subject } from "@/types";
import { motion } from "framer-motion";
import SubjectEditorPanel from "@/components/editor/SubjectEditorPanel";

// Password for editor access
const EDITOR_PASSWORD = process.env.NEXT_PUBLIC_EDITOR_PASSWORD || "quant123"; // Fallback password

// Editor tabs
enum EditorTab {
  POSTS = "posts",
  SUBJECTS = "subjects",
}

export default function EditorPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>(EditorTab.POSTS);
  const [isDeleteSubject, setIsDeleteSubject] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    // Check if already authenticated in session storage
    const authenticated = sessionStorage.getItem("editor-authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }

    async function loadData() {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const tab = searchParams.get("tab");
        if (tab === "subjects") {
          setActiveTab(EditorTab.SUBJECTS);
          const subjectSlug = searchParams.get("subjectSlug");
          if (subjectSlug) {
            const subject = await getSubjectBySlug(subjectSlug);
            if (subject) {
              setSelectedSubject(subject);
            }
          }
          const allSubjects = await getSubjects();
          setSubjects(allSubjects);
        } else {
          setActiveTab(EditorTab.POSTS);
          const postSlug = searchParams.get("slug");
          if (postSlug) {
            const post = await getBlogPostBySlug(postSlug);
            if (post) {
              setSelectedPost(post);
            }
          }
          const allPosts = await getBlogPosts();
          setPosts(allPosts);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchParams, isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === EDITOR_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
      // Store authentication in session storage
      sessionStorage.setItem("editor-authenticated", "true");
    } else {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handleCreateNewPost = () => {
    setSelectedPost(null);
    setActiveTab(EditorTab.POSTS);
    // Clear the URL parameter
    router.push("/editor?tab=posts");
  };

  const handleCreateNewSubject = () => {
    setSelectedSubject(null);
    setActiveTab(EditorTab.SUBJECTS);
    // Clear the URL parameter
    router.push("/editor?tab=subjects");
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setActiveTab(EditorTab.POSTS);
    // Update URL with the post slug
    router.push(`/editor?tab=posts&slug=${post.slug}`);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setActiveTab(EditorTab.SUBJECTS);
    // Update URL with the subject slug
    router.push(`/editor?tab=subjects&subjectSlug=${subject.slug}`);
  };

  const handlePostSaved = (savedPost: BlogPost) => {
    // Update the posts list with the newly saved post
    setPosts((prev) => {
      const index = prev.findIndex((p) => p.id === savedPost.id);
      if (index >= 0) {
        // Update existing post
        const updatedPosts = [...prev];
        updatedPosts[index] = savedPost;
        return updatedPosts;
      } else {
        // Add new post
        return [...prev, savedPost];
      }
    });

    // Select the saved post
    setSelectedPost(savedPost);
    // Update URL with the post slug
    router.push(`/editor?tab=posts&slug=${savedPost.slug}`);
  };

  const handleSubjectSaved = (savedSubject: Subject) => {
    // Update the subjects list with the newly saved subject
    setSubjects((prev) => {
      const index = prev.findIndex((s) => s.id === savedSubject.id);
      if (index >= 0) {
        // Update existing subject
        const updatedSubjects = [...prev];
        updatedSubjects[index] = savedSubject;
        return updatedSubjects;
      } else {
        // Add new subject
        return [...prev, savedSubject];
      }
    });

    // Select the saved subject
    setSelectedSubject(savedSubject);
    // Update URL with the subject slug
    router.push(`/editor?tab=subjects&subjectSlug=${savedSubject.slug}`);
  };

  const handleChangePostOrder = async (postId: string, newOrder: number) => {
    const success = await updateBlogPostOrder(postId, newOrder);
    if (success) {
      // Reload all posts to get the updated order
      const allPosts = await getBlogPosts();
      setPosts(allPosts);
    }
  };

  const handleChangeSubjectOrder = async (
    subjectId: string,
    newOrder: number
  ) => {
    const success = await updateSubjectOrder(subjectId, newOrder);
    if (success) {
      // Reload all subjects to get the updated order
      const allSubjects = await getSubjects();
      setSubjects(allSubjects);
    }
  };

  const handleChangeTab = (tab: EditorTab) => {
    setActiveTab(tab);
    if (tab === EditorTab.POSTS) {
      router.push("/editor?tab=posts");
    } else {
      router.push("/editor?tab=subjects");
    }
  };

  const handleDeleteConfirm = (
    item: BlogPost | Subject,
    isSubject: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setIsDeleteSubject(isSubject);

    if (isSubject) {
      setSelectedSubject(item as Subject);
    } else {
      setSelectedPost(item as BlogPost);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      if (isDeleteSubject && selectedSubject) {
        const success = await deleteSubject(selectedSubject.id);

        if (success) {
          // Remove the subject from the list
          setSubjects((prev) =>
            prev.filter((s) => s.id !== selectedSubject.id)
          );
          // Clear the selected subject
          setSelectedSubject(null);
          // Reset URL
          router.push("/editor?tab=subjects");
        }
      } else if (!isDeleteSubject && selectedPost) {
        const success = await deleteBlogPost(selectedPost.id);

        if (success) {
          // Remove the post from the list
          setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
          // Clear the selected post
          setSelectedPost(null);
          // Reset URL
          router.push("/editor?tab=posts");
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const filteredPosts = categoryFilter
    ? posts.filter((post) => post.category === categoryFilter)
    : posts;

  const filteredSubjects = categoryFilter
    ? subjects.filter((subject) => subject.category === categoryFilter)
    : subjects;

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="w-full max-w-md p-6 brutalist-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-6">
            <FiLock className="mx-auto mb-2" size={48} />
            <h1 className="text-2xl font-bold">Editor Access</h1>
            <p className="text-muted-foreground">
              Please enter the password to access the editor
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 brutalist-border"
                placeholder="Enter password"
                required
              />
              {passwordError && (
                <p className="mt-2 text-destructive">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full mt-4 brutalist-button bg-foreground text-background hover:opacity-90 flex justify-center items-center"
            >
              Access Editor
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              Return to homepage
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="brutalist-button flex items-center gap-2"
              aria-label="Go back to home"
            >
              <FiArrowLeft /> Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold">Blog Editor</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="brutalist-border flex">
              <button
                onClick={() => handleChangeTab(EditorTab.POSTS)}
                className={`px-4 py-2 flex items-center gap-2 ${
                  activeTab === EditorTab.POSTS
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <FiFileText /> Posts
              </button>
              <button
                onClick={() => handleChangeTab(EditorTab.SUBJECTS)}
                className={`px-4 py-2 flex items-center gap-2 ${
                  activeTab === EditorTab.SUBJECTS
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <FiBook /> Subjects
              </button>
            </div>

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="brutalist-button p-2 md:hidden"
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <FiList size={20} />
            </button>

            {activeTab === EditorTab.POSTS ? (
              <button
                onClick={handleCreateNewPost}
                className="brutalist-button flex items-center gap-2"
              >
                <FiPlus /> New Post
              </button>
            ) : (
              <button
                onClick={handleCreateNewSubject}
                className="brutalist-button flex items-center gap-2"
              >
                <FiPlus /> New Subject
              </button>
            )}

            <button
              onClick={() => {
                sessionStorage.removeItem("editor-authenticated");
                setIsAuthenticated(false);
              }}
              className="brutalist-button flex items-center gap-2 bg-destructive text-destructive-foreground"
              title="Sign out"
            >
              <FiLock /> Sign Out
            </button>
          </div>
        </div>

        <p className="text-lg text-muted-foreground">
          {activeTab === EditorTab.POSTS
            ? "Create and manage your blog posts with this powerful editor"
            : "Organize your content by creating and managing subjects"}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with posts/subjects list */}
        {(showSidebar || !loading) && (
          <motion.div
            className="lg:w-64 shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="brutalist-box p-4 editor-sidebar">
              <div className="mb-4">
                <label className="block mb-2 font-bold">
                  Filter by Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="brutalist-border w-full p-2 bg-background"
                >
                  <option value="">All Categories</option>
                  {Object.values(BlogCategory).map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <h2 className="text-xl font-bold mb-4">
                {activeTab === EditorTab.POSTS ? "Posts" : "Subjects"}
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-foreground border-r-transparent"></div>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : activeTab === EditorTab.POSTS ? (
                // Posts list
                filteredPosts.length > 0 ? (
                  <ul className="space-y-3">
                    {filteredPosts.map((post) => (
                      <li key={post.id} className="transition-all">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleEditPost(post)}
                            className={`text-left block w-full p-3 brutalist-border hover:translate-x-1 transition-transform ${
                              selectedPost?.id === post.id
                                ? "bg-accent text-accent-foreground font-bold"
                                : "bg-background"
                            }`}
                          >
                            <div className="font-medium truncate">
                              {post.title}
                            </div>
                            <div className="text-xs opacity-70 mt-1">
                              {post.category} •{" "}
                              {new Date(post.updatedAt).toLocaleDateString()}
                            </div>
                          </button>
                          <button
                            onClick={(e) => handleDeleteConfirm(post, false, e)}
                            className="ml-2 p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                            title="Delete post"
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 brutalist-border">
                    <p className="text-muted-foreground">No posts found</p>
                    <button
                      onClick={handleCreateNewPost}
                      className="mt-4 brutalist-button inline-flex items-center gap-2"
                    >
                      <FiEdit2 size={16} /> Create your first post
                    </button>
                  </div>
                )
              ) : // Subjects list
              filteredSubjects.length > 0 ? (
                <ul className="space-y-3">
                  {filteredSubjects.map((subject) => (
                    <li key={subject.id} className="transition-all">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleEditSubject(subject)}
                          className={`text-left block w-full p-3 brutalist-border hover:translate-x-1 transition-transform ${
                            selectedSubject?.id === subject.id
                              ? "bg-accent text-accent-foreground font-bold"
                              : "bg-background"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {subject.title}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {subject.category} •{" "}
                            {new Date(subject.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                        <button
                          onClick={(e) => handleDeleteConfirm(subject, true, e)}
                          className="ml-2 p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                          title="Delete subject"
                        >
                          <FiTrash size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 brutalist-border">
                  <p className="text-muted-foreground">No subjects found</p>
                  <button
                    onClick={handleCreateNewSubject}
                    className="mt-4 brutalist-button inline-flex items-center gap-2"
                  >
                    <FiEdit2 size={16} /> Create your first subject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Editor area */}
        <motion.div
          className="flex-1 editor-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {activeTab === EditorTab.POSTS ? (
            <EditorPanel
              initialPost={selectedPost || undefined}
              onSave={handlePostSaved}
            />
          ) : (
            <SubjectEditorPanel
              initialSubject={selectedSubject || undefined}
              onSave={handleSubjectSaved}
            />
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="brutalist-box bg-background p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete "
              {isDeleteSubject ? selectedSubject?.title : selectedPost?.title}"?
              {isDeleteSubject &&
                " All lessons within this subject will need to be reassigned."}
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="brutalist-button"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground brutalist-button"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </span>
                ) : (
                  `Delete ${isDeleteSubject ? "Subject" : "Post"}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
