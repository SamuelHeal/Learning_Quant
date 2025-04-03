import { getBlogPosts } from "@/lib/supabase";
import { BlogCategory } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const revalidate = 3600; // Revalidate every hour

export default async function AIMLPage() {
  const posts = await getBlogPosts(BlogCategory.AI_ML);

  return (
    <div className="flex flex-col md:flex-row">
      <BlogSidebar posts={posts} category={BlogCategory.AI_ML} />

      <div className="flex-1 px-4 md:px-8 md:h-[90vh] md:overflow-y-auto md:mt-4">
        <div className="brutalist-box p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            AI & Machine Learning
          </h1>

          <div className="prose prose-lg max-w-none">
            <p>
              Welcome to the AI & Machine Learning section of Let's Be Quant.
              Here, you'll find a collection of articles, tutorials, and
              research focused on artificial intelligence, machine learning,
              deep learning, and more.
            </p>

            <p>
              Browse through the posts in the sidebar to start learning about AI
              and ML. The posts are arranged from oldest to newest, creating a
              curriculum-like journey through the topics.
            </p>

            {posts.length === 0 && (
              <div className="my-12 text-center p-8 brutalist-border">
                <p className="text-xl mb-4">No posts yet!</p>
                <p>Check back soon for content on AI and machine learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
