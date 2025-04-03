import { notFound, redirect } from "next/navigation";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/supabase";
import { BlogCategory } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogPost from "@/components/blog/BlogPost";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const allPosts = await getBlogPosts();

  return allPosts.map((post) => ({
    category: post.category,
    slug: post.slug,
  }));
}

interface BlogPostPageProps {
  params: {
    category: string;
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { category, slug } = params;

  // Check if category is valid
  if (!Object.values(BlogCategory).includes(category as BlogCategory)) {
    return notFound();
  }

  // Get the post
  const post = await getBlogPostBySlug(slug);

  // If post doesn't exist or is in a different category, return 404
  if (!post) {
    return notFound();
  }

  // If post exists but category in URL doesn't match the post's category, redirect to correct URL
  if (post.category !== category) {
    return redirect(`/${post.category}/${post.slug}`);
  }

  // Get all posts in this category for the sidebar
  const categoryPosts = await getBlogPosts(category);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <BlogSidebar
          posts={categoryPosts}
          category={category}
          currentSlug={slug}
        />

        <div className="flex-1">
          <BlogPost post={post} />
        </div>
      </div>
    </div>
  );
}
