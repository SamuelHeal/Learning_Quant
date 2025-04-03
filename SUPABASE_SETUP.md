# Supabase Setup Guide

This guide will help you set up Supabase for the "Let's Be Quant" blog.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up or log in
2. Create a new project
3. Choose a name for your project (e.g., "lets-be-quant-blog")
4. Set a secure database password
5. Choose a region close to your location
6. Click "Create new project"

## 2. Get Your Supabase Credentials

1. Once your project is created, go to the project dashboard
2. In the sidebar, click on "Settings" (gear icon) -> "API"
3. Under "Project API keys", you'll find:
   - Project URL: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Configure Your Environment Variables

1. In your blog project, create or edit the `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Replace `your_project_url` and `your_anon_key` with the values from step 2.

## 4. Set Up Database Tables

1. In the Supabase dashboard, go to "SQL Editor" in the sidebar
2. Click "New Query"
3. Copy and paste the contents of the `setup-database.sql` file from your project
4. Click "Run" to execute the SQL and create the necessary tables

The SQL script will create:

- `blog_posts` table for storing all blog content
- `research_papers` table for storing research papers
- Appropriate indexes and security policies

## 5. Testing Access

By default, the SQL script sets up security policies that require authentication for writing data but allow public reading. For development purposes, you might want to allow anonymous write access temporarily:

1. In the Supabase dashboard, go to "Authentication" -> "Policies"
2. Find the tables `blog_posts` and `research_papers`
3. You can modify the policies to allow anonymous access for development

If you prefer using SQL, you can uncomment the anonymous access policies at the bottom of the `setup-database.sql` file and run them.

## 6. Restart Your Development Server

After setting up Supabase:

```bash
npm run dev
```

Your blog should now be able to connect to Supabase and save/retrieve data!

## Troubleshooting

If you encounter issues:

1. **Database tables not found**: Make sure you've run the complete SQL script
2. **Authentication errors**: Check that your environment variables are correctly set
3. **Permission errors**: Review the RLS policies in Supabase
