import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getBlogPosts(category?: string) {
  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("order", { ascending: true });

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
