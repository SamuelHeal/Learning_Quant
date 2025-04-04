# Migration Guide: Blog Posts to Subject-Lesson Structure

This guide walks you through migrating the existing blog post structure to the new subject-lesson hierarchy.

## 1. Database Changes

The new structure introduces a `subjects` table that contains blog posts (now called lessons). Each blog post now belongs to a subject.

### Option A: Safe SQL Migration (Recommended for Production)

For existing databases with blog posts, use the safer SQL migration:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrate-database.sql` into a new query
4. Run the query

This script:

- Creates the subjects table
- Adds the subject_id column to blog_posts without constraints first
- Creates default subjects for each category and assigns posts
- Then adds the constraints after data is migrated
- Sets up Row Level Security policies to allow anonymous access for development

### Option B: Clean Installation (Only for New Databases)

If you're setting up a fresh database with no existing blog posts:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `setup-database.sql` into a new query
4. Run the query

## 2. Node.js Migration Script (Alternative to SQL Migration)

As an alternative to the SQL migration, you can use the Node.js migration script, which will:

1. Create a default subject for each category that has blog posts
2. Associate existing blog posts with these subjects

### Running the Migration Script

```bash
# Install tsx if you don't have it
npm install -g tsx

# Run the migration script
npm run migrate
```

The migration will:

- Create a default subject called "[Category] Fundamentals" for each category
- Assign all existing blog posts to their respective category subject
- Log the migration progress

## 3. Manual Adjustments After Migration

After running the migration, you may want to:

1. Create more specific subjects for your blog posts
2. Reassign some blog posts to different subjects
3. Adjust the order of subjects and lessons

You can do this through the admin interface or directly in the Supabase dashboard.

## 4. Frontend Changes

The frontend code has been updated to use the new subject-lesson structure, with new routes:

- `/{category}/subjects` - Lists all subjects in a category
- `/{category}/subjects/{subjectSlug}` - Shows a subject and its lessons
- `/{category}/subjects/{subjectSlug}/lessons/{lessonSlug}` - Shows a specific lesson

## 5. Row Level Security (RLS) Policies

The migration scripts set up Row Level Security (RLS) policies that enable anonymous access for development purposes. This means:

- Anyone can read, create, update, and delete records in the subjects and blog_posts tables
- No authentication is required

### For Production Environments

For production environments, you should modify the RLS policies to require authentication:

1. Go to your Supabase SQL Editor
2. Comment out the development policies and uncomment the production policies in the SQL script
3. Run these SQL commands:

```sql
-- Remove the development policies
DROP POLICY "Allow full anonymous access" ON public.subjects;
DROP POLICY "Allow full anonymous access" ON public.blog_posts;
DROP POLICY "Allow full anonymous access" ON public.research_papers;

-- Create read-only policies for public access
CREATE POLICY "Allow public read access"
ON public.subjects FOR SELECT USING (true);

CREATE POLICY "Allow public read access"
ON public.blog_posts FOR SELECT USING (true);

-- Create policies for authenticated users to modify data
CREATE POLICY "Allow authenticated users to insert"
ON public.subjects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update"
ON public.subjects FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete"
ON public.subjects FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for blog_posts
CREATE POLICY "Allow authenticated users to insert"
ON public.blog_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update"
ON public.blog_posts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete"
ON public.blog_posts FOR DELETE USING (auth.role() = 'authenticated');
```

## 6. Troubleshooting

### Migration Script Fails

If the migration script fails, check:

1. Your Supabase credentials in `.env.local`
2. That your database tables match the expected schema
3. The error messages in the console output

### Row Level Security Issues

If you see errors like "violates row-level security policy" or error code 42501:

1. Ensure you're running with the development RLS policies for testing
2. For production, make sure users are properly authenticated
3. Check that the RLS policies match your application's authentication setup

### Subject IDs in Blog Posts

If blog posts aren't appearing in subjects, verify that:

1. The `subject_id` field is correctly set in the blog post records
2. The subject exists with the correct ID

For any other issues, check the Supabase logs and application error messages.
