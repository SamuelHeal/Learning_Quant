import { notFound, redirect } from "next/navigation";
import {
  getSubjectBySlug,
  getBlogPostBySlug,
  getBlogPosts,
  getSubjects,
} from "@/lib/supabase";
import { BlogCategory } from "@/types";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogPost from "@/components/blog/BlogPost";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const allPosts = await getBlogPosts();
  const allSubjects = await getSubjects();

  return allPosts
    .map((post) => {
      const subject = allSubjects.find((s) => s.id === post.subject_id);
      return {
        category: post.category,
        subjectSlug: subject?.slug || "",
        lessonSlug: post.slug,
      };
    })
    .filter((params) => params.subjectSlug); // Filter out any without a valid subject
}

interface LessonPageProps {
  params: {
    category: string;
    subjectSlug: string;
    lessonSlug: string;
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { category, subjectSlug, lessonSlug } = resolvedParams;

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

  // Get the lesson (blog post)
  const lesson = await getBlogPostBySlug(lessonSlug);

  // If lesson doesn't exist or belongs to a different subject, return 404
  if (!lesson || lesson.subject_id !== subject.id) {
    return notFound();
  }

  // Get all subjects and posts in this category for the sidebar
  const categorySubjects = await getSubjects(category);
  const categoryPosts = await getBlogPosts(undefined, category);

  return (
    <div className="flex flex-col md:flex-row">
      <BlogSidebar
        posts={categoryPosts}
        subjects={categorySubjects}
        category={category}
        currentSlug={lessonSlug}
        currentSubjectSlug={subjectSlug}
      />

      <div className="flex-1 px-4 md:px-8 md:h-[90vh] md:overflow-y-auto">
        <div className="p-6">
          <BlogPost post={lesson} />
        </div>
      </div>
    </div>
  );
}
