import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubjectBySlug, getBlogPosts, getSubjects } from "@/lib/supabase";
import { BlogCategory, BlogPost as BlogPostType } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const allSubjects = await getSubjects();

  return allSubjects.map((subject) => ({
    category: subject.category,
    subjectSlug: subject.slug,
  }));
}

interface SubjectPageProps {
  params: {
    category: string;
    subjectSlug: string;
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { category, subjectSlug } = params;

  // Check if category is valid
  if (!Object.values(BlogCategory).includes(category as BlogCategory)) {
    return notFound();
  }

  // Get the subject
  const subject = await getSubjectBySlug(subjectSlug);

  // If subject doesn't exist or is in a different category, return 404
  if (!subject || subject.category !== category) {
    return notFound();
  }

  // Get all lessons (blog posts) for this subject
  const lessons = await getBlogPosts(subject.id);

  // Get all subjects in this category for the sidebar
  const categorySubjects = await getSubjects(category);
  const categoryPosts = await getBlogPosts(undefined, category);

  return (
    <div className="flex flex-col md:flex-row">
      <BlogSidebar
        posts={categoryPosts}
        subjects={categorySubjects}
        category={category}
        currentSubjectSlug={subjectSlug}
      />

      <div className="flex-1 px-4 md:px-8 md:h-[90vh] md:overflow-y-auto">
        <div className="p-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {subject.title}
          </h1>
          <p className="text-lg mb-6">{subject.description}</p>

          <h2 className="text-2xl font-bold mb-4">Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.length > 0 ? (
              lessons.map((lesson: BlogPostType) => (
                <Link
                  key={lesson.id}
                  href={`/${category}/subjects/${subjectSlug}/lessons/${lesson.slug}`}
                  className="brutalist-border p-6 hover:shadow-lg transition-all"
                >
                  <h3 className="text-xl font-bold mb-2">{lesson.title}</h3>
                  <p className="mb-4">{lesson.description}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {lesson.tags.map((tag) => (
                      <span
                        key={tag}
                        className="brutalist-border px-2 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Last updated:{" "}
                    {new Date(lesson.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              ))
            ) : (
              <p className="col-span-3 text-center text-muted-foreground">
                No lessons available for this subject yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
