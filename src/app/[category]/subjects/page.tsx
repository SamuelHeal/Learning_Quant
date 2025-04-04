import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubjects, getBlogPosts } from "@/lib/supabase";
import { BlogCategory, Subject } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const revalidate = 3600; // Revalidate every hour

interface CategorySubjectsPageProps {
  params: {
    category: string;
  };
}

export default async function CategorySubjectsPage({
  params,
}: CategorySubjectsPageProps) {
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { category } = resolvedParams;

  // Check if category is valid
  if (!Object.values(BlogCategory).includes(category as BlogCategory)) {
    return notFound();
  }

  // Get subjects for this category
  const subjects = await getSubjects(category);
  const categoryPosts = await getBlogPosts(undefined, category);

  return (
    <div className="flex flex-col md:flex-row">
      <BlogSidebar
        posts={categoryPosts}
        subjects={subjects}
        category={category}
      />

      <div className="flex-1 px-4 md:px-8 md:h-[90vh] md:overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            {category.charAt(0).toUpperCase() + category.slice(1)} Subjects
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.length > 0 ? (
              subjects.map((subject: Subject) => (
                <Link
                  key={subject.id}
                  href={`/${category}/subjects/${subject.slug}`}
                  className="brutalist-border p-6 hover:shadow-lg transition-all"
                >
                  <h2 className="text-xl font-bold mb-2">{subject.title}</h2>
                  <p className="mb-4">{subject.description}</p>
                  <span className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(subject.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">
                No subjects available for this category yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
