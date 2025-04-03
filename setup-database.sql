-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create blog_posts table
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    content JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "order" INTEGER DEFAULT 0
);

-- Create research_papers table
CREATE TABLE public.research_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    authors TEXT[] NOT NULL,
    abstract TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "publishedDate" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tags TEXT[] DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX blog_posts_category_idx ON public.blog_posts(category);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts(slug);

-- Set up Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;

-- Create policies to allow read access
CREATE POLICY "Allow public read access" 
ON public.blog_posts FOR SELECT USING (true);

CREATE POLICY "Allow public read access" 
ON public.research_papers FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update/delete data
-- You might need to adjust these based on your authentication setup
CREATE POLICY "Allow authenticated users to insert" 
ON public.blog_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" 
ON public.blog_posts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" 
ON public.blog_posts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert" 
ON public.research_papers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update" 
ON public.research_papers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete" 
ON public.research_papers FOR DELETE USING (auth.role() = 'authenticated');

-- If you want to allow anonymous access for testing purposes, use these policies instead:
-- Note: Use these only for development, not in production!

-- COMMENT OUT THE ABOVE POLICIES AND UNCOMMENT THESE FOR ANONYMOUS ACCESS:
/*
CREATE POLICY "Allow full anonymous access" 
ON public.blog_posts FOR ALL USING (true);

CREATE POLICY "Allow full anonymous access" 
ON public.research_papers FOR ALL USING (true);
*/ 