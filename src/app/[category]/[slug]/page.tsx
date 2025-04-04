import { notFound, redirect } from "next/navigation";
import { getBlogPostBySlug, getBlogPosts, getSubjects } from "@/lib/supabase";
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
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { category, slug } = resolvedParams;

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

  // Get all subjects to find the slug for this post's subject
  const subjects = await getSubjects();
  const subject = subjects.find((s) => s.id === post.subject_id);

  if (!subject) {
    return notFound();
  }

  // Redirect to the new URL structure using subject slug
  return redirect(`/${category}/subjects/${subject.slug}/lessons/${post.slug}`);
}
