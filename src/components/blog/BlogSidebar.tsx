"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiBook,
  FiFileText,
} from "react-icons/fi";
import { BlogPost, Subject } from "@/types";

interface BlogSidebarProps {
  posts: BlogPost[];
  subjects: Subject[];
  category: string;
  currentSlug?: string;
  currentSubjectSlug?: string;
}

export default function BlogSidebar({
  posts,
  subjects,
  category,
  currentSlug,
  currentSubjectSlug,
}: BlogSidebarProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);

  // Initialize expanded subjects based on current subject/post
  useEffect(() => {
    if (currentSubjectSlug && !expandedSubjects.includes(currentSubjectSlug)) {
      setExpandedSubjects((prev) => [...prev, currentSubjectSlug]);
    } else if (currentSlug && !currentSubjectSlug) {
      // If we only have a post slug but no subject slug, find the subject for this post
      const post = posts.find((p) => p.slug === currentSlug);
      if (post) {
        const subject = subjects.find((s) => s.id === post.subject_id);
        if (subject && !expandedSubjects.includes(subject.slug)) {
          setExpandedSubjects((prev) => [...prev, subject.slug]);
        }
      }
    }
  }, [currentSubjectSlug, currentSlug, subjects, posts, expandedSubjects]);

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

  // Filter subjects based on whether they have any matching posts
  const filteredSubjects = subjects.filter((subject) =>
    filteredPosts.some((post) => post.subject_id === subject.id)
  );

  // Group posts by subject
  const postsBySubject: Record<string, BlogPost[]> = {};
  filteredPosts.forEach((post) => {
    if (!postsBySubject[post.subject_id]) {
      postsBySubject[post.subject_id] = [];
    }
    postsBySubject[post.subject_id].push(post);
  });

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleSubject = (subjectSlug: string) => {
    setExpandedSubjects((prev) =>
      prev.includes(subjectSlug)
        ? prev.filter((s) => s !== subjectSlug)
        : [...prev, subjectSlug]
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

      {/* Subject and Post list */}
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FiBook /> {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
        Subjects
      </h3>

      {filteredSubjects.length > 0 ? (
        <ul className="space-y-4">
          {filteredSubjects.map((subject) => {
            const subjectPosts = postsBySubject[subject.id] || [];
            const isExpanded = expandedSubjects.includes(subject.slug);

            return (
              <li key={subject.id} className="brutalist-border p-2">
                <button
                  onClick={() => toggleSubject(subject.slug)}
                  className="flex items-center justify-between w-full font-semibold p-1"
                >
                  <span>{subject.title}</span>
                  <FiChevronRight
                    className={`transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {isExpanded && subjectPosts.length > 0 && (
                  <ul className="mt-2 pl-2 space-y-1 border-l-2 border-muted">
                    {subjectPosts.map((post) => (
                      <li key={post.id}>
                        <Link
                          href={`/${category}/subjects/${subject.slug}/lessons/${post.slug}`}
                          className={`block p-2 hover:translate-x-1 transition-transform flex items-center gap-1 ${
                            currentSlug === post.slug
                              ? "font-bold bg-accent/10"
                              : ""
                          }`}
                        >
                          <FiFileText size={14} />
                          <span>{post.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center py-4">No subjects or posts found</p>
      )}
    </div>
  );
}
