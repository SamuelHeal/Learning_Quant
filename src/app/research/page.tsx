"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiFilter, FiDownload, FiChevronRight } from "react-icons/fi";
import { getResearchPapers } from "@/lib/supabase";
import { ResearchPaper } from "@/types";

export default function ResearchPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPapers() {
      try {
        const fetchedPapers = await getResearchPapers();
        setPapers(fetchedPapers);
      } catch (error) {
        console.error("Error fetching research papers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPapers();
  }, []);

  // Get all unique tags
  const allTags = Array.from(
    new Set(papers.flatMap((paper) => paper.tags || []))
  );

  // Filter papers based on search and tags
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      search === "" ||
      paper.title.toLowerCase().includes(search.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(search.toLowerCase()) ||
      paper.authors.some((author) =>
        author.toLowerCase().includes(search.toLowerCase())
      );

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => paper.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="brutalist-box p-6 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Research Papers</h1>
        <p className="text-lg mb-8">
          Browse through my research papers focused on quantitative finance,
          machine learning, and mathematical modeling.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="md:w-2/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search papers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="brutalist-border w-full p-3 pl-10"
              />
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2"
                size={20}
              />
            </div>
          </div>

          <div className="md:w-1/3">
            <button
              className="brutalist-button flex items-center justify-between w-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span className="flex items-center">
                <FiFilter className="mr-2" /> Filter by tags
              </span>
              <FiChevronRight
                className={`transition-transform ${
                  showFilters ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-8 brutalist-border p-4">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-sm px-3 py-1 ${
                    selectedTags.includes(tag)
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

        {loading ? (
          <div className="text-center py-12">
            <p>Loading research papers...</p>
          </div>
        ) : filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredPapers.map((paper) => (
              <div key={paper.id} className="brutalist-box p-6">
                <h2 className="text-xl font-bold mb-2">{paper.title}</h2>
                <p className="font-mono text-sm mb-4">
                  {paper.authors.join(", ")} •{" "}
                  {new Date(paper.publishedDate).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {paper.tags.map((tag) => (
                    <span
                      key={tag}
                      className="brutalist-border px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mb-4">{paper.abstract}</p>
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutalist-button inline-flex items-center"
                >
                  <FiDownload className="mr-2" /> Download PDF
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 brutalist-border">
            <p className="text-xl mb-4">No research papers found</p>
            <p>
              {search || selectedTags.length > 0
                ? "Try adjusting your search or filters."
                : "Check back soon for research content."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
