"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiPlus, FiEdit2, FiList, FiTrash } from "react-icons/fi";
import EditorPanel from "@/components/editor/EditorPanel";
import {
  getBlogPostBySlug,
  getBlogPosts,
  updateBlogPostOrder,
  deleteBlogPost,
} from "@/lib/supabase";
import { BlogPost, BlogCategory } from "@/types";
import { motion } from "framer-motion";

export default function EditorPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const slug = searchParams.get("slug");

        // Load the specific post if a slug is provided
        if (slug) {
          const post = await getBlogPostBySlug(slug);
          if (post) {
            setSelectedPost(post);
          }
        }

        // Load all posts for the sidebar
        const allPosts = await getBlogPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [searchParams]);

  const handleCreateNewPost = () => {
    setSelectedPost(null);
    // Clear the URL parameter
    router.push("/editor");
  };

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    // Update URL with the post slug
    router.push(`/editor?slug=${post.slug}`);
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
    router.push(`/editor?slug=${savedPost.slug}`);
  };

  const handleChangePostOrder = async (postId: string, newOrder: number) => {
    const success = await updateBlogPostOrder(postId, newOrder);
    if (success) {
      // Reload all posts to get the updated order
      const allPosts = await getBlogPosts();
      setPosts(allPosts);
    }
  };

  const handleDeleteConfirm = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setSelectedPost(post);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    setIsDeleting(true);
    try {
      const success = await deleteBlogPost(selectedPost.id);

      if (success) {
        // Remove the post from the list
        setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
        // Clear the selected post
        setSelectedPost(null);
        // Reset URL
        router.push("/editor");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
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
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="brutalist-button p-2 md:hidden"
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <FiList size={20} />
            </button>

            <button
              onClick={handleCreateNewPost}
              className="brutalist-button flex items-center gap-2"
            >
              <FiPlus /> New Post
            </button>
          </div>
        </div>

        <p className="text-lg text-muted-foreground">
          Create and manage your blog posts with this powerful editor
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with posts list */}
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

              <h2 className="text-xl font-bold mb-4">Posts</h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-foreground border-r-transparent"></div>
                  <p className="mt-2">Loading posts...</p>
                </div>
              ) : filteredPosts.length > 0 ? (
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
                          onClick={(e) => handleDeleteConfirm(post, e)}
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
          <EditorPanel
            initialPost={selectedPost || undefined}
            onSave={handlePostSaved}
          />
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="brutalist-box bg-background p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete "{selectedPost?.title}"? This
              action cannot be undone.
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
                onClick={handleDeletePost}
                className="bg-destructive text-destructive-foreground brutalist-button"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </span>
                ) : (
                  "Delete Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
