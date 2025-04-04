-- This script safely migrates the database from blog posts to subject-lesson structure
-- It can be run on an existing database with blog posts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "order" INTEGER DEFAULT 0
);

-- First add subject_id column to blog_posts without the constraint
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Create default subjects for each category in blog_posts
DO $$
DECLARE
    category_name TEXT;
    subject_id UUID;
    category_cursor CURSOR FOR
        SELECT DISTINCT category FROM public.blog_posts;
BEGIN
    OPEN category_cursor;
    
    LOOP
        FETCH category_cursor INTO category_name;
        EXIT WHEN NOT FOUND;
        
        -- Create a subject for this category
        subject_id := uuid_generate_v4();
        INSERT INTO public.subjects (
            id, 
            title, 
            slug, 
            description, 
            category
        ) VALUES (
            subject_id,
            INITCAP(REPLACE(category_name, '-', ' ')) || ' Fundamentals',
            category_name || '-fundamentals',
            'Core concepts and lessons about ' || REPLACE(category_name, '-', ' ') || '.',
            category_name
        );
        
        -- Update all blog posts in this category to reference the new subject
        UPDATE public.blog_posts
        SET subject_id = subject_id
        WHERE category = category_name;
        
        RAISE NOTICE 'Created subject for category % with ID %', category_name, subject_id;
    END LOOP;
    
    CLOSE category_cursor;
END $$;

-- Now add the foreign key constraint and NOT NULL constraint
ALTER TABLE public.blog_posts 
ALTER COLUMN subject_id SET NOT NULL,
ADD CONSTRAINT fk_blog_posts_subject
FOREIGN KEY (subject_id) REFERENCES public.subjects(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS blog_posts_subject_id_idx ON public.blog_posts(subject_id);
CREATE INDEX IF NOT EXISTS subjects_category_idx ON public.subjects(category);
CREATE INDEX IF NOT EXISTS subjects_slug_idx ON public.subjects(slug);

-- Set up Row Level Security (RLS) for subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- FOR DEVELOPMENT: Allow anonymous access to all operations
-- In production, you would remove these and use the authenticated policies below
CREATE POLICY IF NOT EXISTS "Allow full anonymous access for development" 
ON public.subjects FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow full anonymous access for development" 
ON public.blog_posts FOR ALL USING (true);

-- The policies below are commented out for development but would be used in production
/*
-- Create policies to allow read access
CREATE POLICY IF NOT EXISTS "Allow public read access" 
ON public.subjects FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update/delete data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert" 
ON public.subjects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to update" 
ON public.subjects FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete" 
ON public.subjects FOR DELETE USING (auth.role() = 'authenticated');
*/ 