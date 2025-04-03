"use client";

import { useState } from "react";
import Link from "next/link";
import { FiSearch, FiFilter, FiChevronRight } from "react-icons/fi";
import { BlogPost } from "@/types";

interface BlogSidebarProps {
  posts: BlogPost[];
  category: string;
  currentSlug?: string;
}

export default function BlogSidebar({
  posts,
  category,
  currentSlug,
}: BlogSidebarProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // Get unique tags from all posts
  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags || [])));

  // Filter posts based on search and tags
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      search === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase());

    const matchesTags =
      tags.length === 0 || tags.every((tag) => post.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="w-full md:w-64 lg:w-72 shrink-0 border-r-[3px] border-foreground p-6 pt-8 md:sticky md:h-[90vh] md:overflow-y-auto">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="brutalist-border w-full p-2 pl-10"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Filter toggle */}
      <button
        className="brutalist-button flex items-center justify-between w-full mb-4"
        onClick={() => setShowFilters(!showFilters)}
      >
        <span className="flex items-center">
          <FiFilter className="mr-2" /> Filter by tags
        </span>
        <FiChevronRight
          className={`transition-transform ${showFilters ? "rotate-90" : ""}`}
        />
      </button>

      {/* Tag filters */}
      {showFilters && (
        <div className="mb-6 brutalist-border p-3">
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`text-sm px-2 py-1 ${
                  tags.includes(tag)
                    ? "bg-foreground text-background"
                    : "brutalist-border"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Post list */}
      <h3 className="text-xl font-bold mb-4">
        {category.charAt(0).toUpperCase() + category.slice(1)} Posts
      </h3>

      {filteredPosts.length > 0 ? (
        <ul className="space-y-3">
          {filteredPosts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/${category}/${post.slug}`}
                className={`block p-2 border-l-3 hover:translate-x-1 transition-transform ${
                  currentSlug === post.slug
                    ? "border-foreground font-bold"
                    : "border-transparent"
                }`}
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center py-4">No posts found</p>
      )}
    </div>
  );
}
