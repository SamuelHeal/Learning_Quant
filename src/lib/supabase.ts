import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Subject-related functions
export async function getSubjects(category?: string) {
  let query = supabase
    .from("subjects")
    .select("*")
    .order("order", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'subjects' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error fetching subjects:", error);
    }
    return [];
  }

  return data;
}

export async function getSubjectBySlug(slug: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'subjects' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error fetching subject:", error);
    }
    return null;
  }

  return data;
}

export async function saveSubject(subject: any) {
  // Check if Supabase credentials are configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error: Supabase URL or Anon Key is missing.");
    console.error(
      "Please make sure your .env.local file is properly configured with:"
    );
    console.error("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key");
    return null;
  }
  console.log(subject);
  // Log the subject data being saved (for debugging)
  console.log("Attempting to save subject:", JSON.stringify(subject, null, 2));

  // First, check if the subjects table exists
  try {
    const { error: tableCheckError } = await supabase
      .from("subjects")
      .select("id")
      .limit(1);

    if (tableCheckError) {
      console.error("Failed to access the 'subjects' table:", tableCheckError);
      console.error(
        "The table may not exist yet. Please run the migration script."
      );
      return null;
    }
  } catch (checkError) {
    console.error("Error checking table existence:", checkError);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("subjects")
      .upsert(subject)
      .select();

    if (error) {
      console.error("Error saving subject - raw error object:", error);

      // Safely extract error properties
      const errorCode = error.code || "unknown";
      const errorMessage = error.message || "No error message available";
      const errorDetails = error.details || "No details available";

      if (errorCode === "42P01") {
        console.error(
          "Error: The 'subjects' table doesn't exist in your Supabase database."
        );
        console.error(
          "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
        );
      } else if (errorCode === "42703") {
        console.error("Error: Column doesn't exist in the 'subjects' table.");
        console.error(
          "Please make sure your database schema matches the application's data model."
        );
      } else {
        console.error(`Error saving subject (${errorCode}): ${errorMessage}`);
        console.error("Error details:", errorDetails);

        // Check for common issues
        if (errorCode === "23505") {
          console.error(
            "This appears to be a unique constraint violation. A subject with this slug might already exist."
          );
        } else if (errorCode === "23502") {
          console.error(
            "This appears to be a not-null constraint violation. You're missing a required field."
          );
        } else if (errorCode === "42P10") {
          console.error("Invalid JSON format in the request.");
        }
      }
      return null;
    }

    if (!data || data.length === 0) {
      console.error("No data returned after saving subject.");
      return null;
    }

    console.log("Subject saved successfully:", data[0]);
    return data[0];
  } catch (error: any) {
    console.error("Unexpected error saving subject - raw error:", error);
    console.error("Error type:", typeof error);
    console.error("Error is instance of Error:", error instanceof Error);

    const errorMessage = error?.message || String(error) || "Unknown error";
    console.error("Error message:", errorMessage);

    if (error?.stack) {
      console.error("Error stack:", error.stack);
    }

    return null;
  }
}

export async function deleteSubject(id: string) {
  try {
    // First check if there are any blog posts associated with this subject
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("subject_id", id);

    if (posts && posts.length > 0) {
      console.error(
        `Cannot delete subject: ${posts.length} blog posts are still associated with it`
      );
      return false;
    }

    const { error } = await supabase.from("subjects").delete().eq("id", id);

    if (error) {
      console.error("Error deleting subject:", error);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Unexpected error deleting subject:", error);
    return false;
  }
}

// Blog post functions
export async function getBlogPosts(subject_id?: string, category?: string) {
  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("order", { ascending: true });

  if (subject_id) {
    query = query.eq("subject_id", subject_id);
  }

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'blog_posts' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error fetching blog posts:", error);
    }
    return [];
  }

  return data;
}

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'blog_posts' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error fetching blog post:", error);
    }
    return null;
  }

  return data;
}

export async function getResearchPapers() {
  const { data, error } = await supabase
    .from("research_papers")
    .select("*")
    .order("publishedDate", { ascending: false });

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'research_papers' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error fetching research papers:", error);
    }
    return [];
  }

  return data;
}

export async function updateBlogPostOrder(id: string, order: number) {
  const { error } = await supabase
    .from("blog_posts")
    .update({ order })
    .eq("id", id);

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'blog_posts' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error updating blog post order:", error);
    }
    return false;
  }

  return true;
}

export async function updateSubjectOrder(id: string, order: number) {
  const { error } = await supabase
    .from("subjects")
    .update({ order })
    .eq("id", id);

  if (error) {
    if (error.code === "42P01") {
      console.error(
        "Error: The 'subjects' table doesn't exist in your Supabase database."
      );
      console.error(
        "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
      );
    } else {
      console.error("Error updating subject order:", error);
    }
    return false;
  }

  return true;
}

export async function saveBlogPost(blogPost: any) {
  // Check if Supabase credentials are configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error: Supabase URL or Anon Key is missing.");
    console.error(
      "Please make sure your .env.local file is properly configured with:"
    );
    console.error("NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .upsert(blogPost)
      .select();

    if (error) {
      if (error.code === "42P01") {
        console.error(
          "Error: The 'blog_posts' table doesn't exist in your Supabase database."
        );
        console.error(
          "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
        );
      } else if (error.code === "42703") {
        console.error("Error: Column doesn't exist in the 'blog_posts' table.");
        console.error(
          "Please make sure your database schema matches the application's data model."
        );
      } else {
        console.error("Error saving blog post:", error);
      }
      return null;
    }

    return data[0];
  } catch (error: any) {
    console.error("Unexpected error saving blog post:", error);
    return null;
  }
}

export async function deleteBlogPost(id: string) {
  try {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      if (error.code === "42P01") {
        console.error(
          "Error: The 'blog_posts' table doesn't exist in your Supabase database."
        );
        console.error(
          "Please run the SQL script in 'setup-database.sql' in your Supabase SQL Editor."
        );
      } else {
        console.error("Error deleting blog post:", error);
      }
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Unexpected error deleting blog post:", error);
    return false;
  }
}
