# Subject-Lesson Structure Implementation

## Overview

This document summarizes the changes made to implement the new subject-lesson structure, replacing the previous flat blog post structure.

## Database Changes

1. **New Subjects Table**

   - Added a `subjects` table to store subject information
   - Each subject belongs to a category and contains multiple lessons (blog posts)

2. **Updated Blog Posts Table**
   - Added `subject_id` field that references the subjects table
   - Blog posts now function as lessons within subjects

## Data Model Changes

1. **Added Subject Interface**

   ```typescript
   export interface Subject {
     id: string;
     title: string;
     slug: string;
     description: string;
     category: BlogCategory;
     createdAt: string;
     updatedAt: string;
     order?: number;
   }
   ```

2. **Updated BlogPost Interface**
   - Added `subject_id` field to reference the parent subject

## API Functions

1. **New Subject Functions**

   - `getSubjects(category?)` - Get all subjects, optionally filtered by category
   - `getSubjectBySlug(slug)` - Get a specific subject by its slug
   - `saveSubject(subject)` - Create or update a subject
   - `deleteSubject(id)` - Delete a subject if it has no associated blog posts

2. **Updated Blog Post Functions**
   - Modified `getBlogPosts(subject_id?, category?)` to filter by subject

## Migration Tools

1. **SQL Migration Script**

   - Created `migrate-database.sql` for safe migration of existing data
   - Adds subjects table and migrates existing blog posts to reference subjects

2. **Node.js Migration Script**
   - Created a TypeScript migration script as an alternative approach
   - Handles the creation of default subjects and assignment of blog posts

## Next Steps

The database and API structure have been implemented. The next phase will involve:

1. **Frontend Implementation**

   - Create new routes for subjects and lessons
   - Update UI components to display the hierarchy
   - Implement navigation between subjects and lessons

2. **Content Management**
   - Update the editor to support creating/editing subjects
   - Allow assigning blog posts to different subjects
   - Add ordering capabilities for subjects and lessons
