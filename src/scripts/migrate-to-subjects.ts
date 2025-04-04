import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { BlogCategory } from "@/types";

/**
 * This script helps migrate from the old structure (just blog posts)
 * to the new structure (subjects containing lessons/blog posts)
 *
 * It:
 * 1. Creates default subjects for each category
 * 2. Assigns existing blog posts to these subjects
 */
async function migrateToSubjects() {
  console.log("Starting migration to subjects structure...");

  // Get all existing blog posts
  const { data: existingPosts, error: postsError } = await supabase
    .from("blog_posts")
    .select("*");

  if (postsError) {
    console.error("Error fetching existing blog posts:", postsError);
    return;
  }

  if (!existingPosts || existingPosts.length === 0) {
    console.log("No existing blog posts found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${existingPosts.length} blog posts to migrate.`);

  // Create default subjects for each category
  const defaultSubjects: Record<string, string> = {};

  for (const category of Object.values(BlogCategory)) {
    // Check if there are posts in this category
    const postsInCategory = existingPosts.filter(
      (post) => post.category === category
    );

    if (postsInCategory.length === 0) {
      console.log(
        `No posts in category ${category}, skipping subject creation.`
      );
      continue;
    }

    const subjectId = uuidv4();
    const subjectData = {
      id: subjectId,
      title: `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } Fundamentals`,
      slug: `${category}-fundamentals`,
      description: `Core concepts and lessons about ${category.replace(
        "-",
        " "
      )}.`,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    };

    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .insert(subjectData)
      .select()
      .single();

    if (subjectError) {
      console.error(`Error creating subject for ${category}:`, subjectError);
      continue;
    }

    console.log(`Created subject "${subject.title}" for category ${category}`);
    defaultSubjects[category] = subject.id;
  }

  // Update each blog post with its subject_id
  let successCount = 0;
  let errorCount = 0;

  for (const post of existingPosts) {
    const subjectId = defaultSubjects[post.category];

    if (!subjectId) {
      console.error(
        `No subject found for category ${post.category}, skipping post "${post.title}"`
      );
      errorCount++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ subject_id: subjectId })
      .eq("id", post.id);

    if (updateError) {
      console.error(`Error updating post "${post.title}":`, updateError);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log(
    `Migration complete! ${successCount} posts updated successfully, ${errorCount} errors.`
  );
}

// Uncomment the line below to run the migration
// migrateToSubjects().catch(console.error);

export default migrateToSubjects;
