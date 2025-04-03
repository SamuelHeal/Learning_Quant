"use client";

import { BlogPost as BlogPostType, ContentType, TextContent } from "@/types";
import BlogContentBlock from "./BlogContent";
import HighlightableText from "./HighlightableText";
import NotesSidebar from "./NotesSidebar";

interface BlogPostProps {
  post: BlogPostType;
}

export default function BlogPost({ post }: BlogPostProps) {
  // Apply postSlug to all text content blocks for highlighting
  const contentWithPostSlug = post.content.map((block) => {
    if (block.type === ContentType.TEXT) {
      return {
        ...block,
        postSlug: post.slug,
      } as TextContent;
    }
    return block;
  });

  console.log("BlogPost slug:", post.slug);
  console.log("Enhanced content blocks with postSlug:", contentWithPostSlug);

  return (
    <div className="w-full px-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="brutalist-border px-2 py-1 text-sm">
              {tag}
            </span>
          ))}
        </div>
        <HighlightableText
          content={post.description}
          postSlug={post.slug}
          className="text-lg mb-6"
        />
        <div className="font-mono text-sm">
          Published:{" "}
          {new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
          {post.updatedAt !== post.createdAt && (
            <span>
              {" "}
              • Updated:{" "}
              {new Date(post.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {contentWithPostSlug.map((block) => (
          <BlogContentBlock key={block.id} content={block} />
        ))}
      </div>

      {/* Notes sidebar */}
      <NotesSidebar postSlug={post.slug} />
    </div>
  );
}
