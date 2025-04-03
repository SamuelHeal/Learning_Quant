import { getBlogPosts } from "@/lib/supabase";
import { BlogCategory } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const revalidate = 3600; // Revalidate every hour

export default async function FinancePage() {
  const posts = await getBlogPosts(BlogCategory.FINANCE);

  return (
    <div className="flex flex-col md:flex-row">
      <BlogSidebar posts={posts} category={BlogCategory.FINANCE} />

      <div className="flex-1 px-4 md:px-8 md:h-[90vh] md:overflow-y-auto md:mt-4">
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Quantitative Finance
          </h1>

          <div className="prose prose-lg max-w-none">
            <p>
              Welcome to the Quantitative Finance section of Let's Be Quant.
              Here, you'll find a collection of articles, tutorials, and
              research focused on financial mathematics, trading strategies,
              market analysis, and more.
            </p>

            <p>
              Browse through the posts in the sidebar to start learning about
              quantitative finance. The posts are arranged from oldest to
              newest, creating a curriculum-like journey through the topics.
            </p>

            {posts.length === 0 && (
              <div className="my-12 text-center p-8 brutalist-border">
                <p className="text-xl mb-4">No posts yet!</p>
                <p>Check back soon for content on quantitative finance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
