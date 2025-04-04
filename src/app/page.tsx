import Link from "next/link";
import Image from "next/image";
import { getSubjects, getBlogPosts } from "@/lib/supabase";
import { BlogPost } from "@/types";
import SimulationWrapper from "@/components/ui/SimulationWrapper";

export const revalidate = 3600; // Revalidate every hour

async function getRecentPosts() {
  const posts = await getBlogPosts();
  return posts.slice(0, 3); // Get only 3 most recent posts
}

export default async function Home() {
  const recentPosts = await getRecentPosts();
  // Get subject for each post
  const allSubjects = await getSubjects();

  // Enrich posts with their subject information
  const enrichedPosts = recentPosts.map((post) => {
    const subject = allSubjects.find((s) => s.id === post.subject_id);
    return {
      ...post,
      subjectSlug: subject?.slug || "",
    };
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Learning{" "}
                <span className="underline underline-offset-4">Quant</span>
              </h1>
              <h2 className="text-2xl mb-8">By Samuel Heal</h2>
              <p className="text-xl mb-8">
                In this educational blog, I explore the interconnected domains
                of Mathematics, AI/ML, and Quantitative Finance through
                structured blogs and interactive code examples. This serves as
                both a learning journal for myself and a resource for visitors
                seeking to understand these complex fields. I highly encourage
                you to leave comments and notes for yourself, and send me
                corrections to me so that I can improve the accuracy of the
                content and learn more myself.
              </p>
              <p className="text-xl mb-8">
                To add notes, simply highlight some text and click the "Add
                Note" button. You can then elect to forward the note to me, and
                I will seek to get back to you asap.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/finance/subjects" className="brutalist-button">
                  Finance
                </Link>
                <Link href="/ai-ml/subjects" className="brutalist-button">
                  AI/ML
                </Link>
                <Link href="/mathematics/subjects" className="brutalist-button">
                  Mathematics
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 brutalist-box p-6">
              <div className="aspect-square relative">
                {/* Algorithmic Trading Simulation */}
                <SimulationWrapper />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="py-20 bg-accent text-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Recently Posted
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {enrichedPosts.length > 0 ? (
              enrichedPosts.map((post: any) => (
                <Link
                  href={`/${post.category}/subjects/${post.subjectSlug}/lessons/${post.slug}`}
                  key={post.id}
                  className="brutalist-box bg-secondary text-primary p-6 transition-transform hover:-translate-y-2"
                >
                  <span className="inline-block text-sm font-mono mb-2 brutalist-border px-2 py-1">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-bold mb-4">{post.title}</h3>
                  <p className="mb-4">{post.description}</p>
                  <div className="text-sm">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center">
                <p className="text-xl">No posts yet. Check back soon!</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/finance/subjects"
              className="brutalist-button bg-secondary text-primary"
            >
              View All Subjects
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
