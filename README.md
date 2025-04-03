# Let's Be Quant Blog

A neo-brutalist blog dedicated to exploring and teaching mathematics, machine learning, artificial intelligence, and quantitative finance.

## Features

- Educational blog with a focus on quantitative finance and trading
- Responsive design with a black and white neo-brutalist theme
- Dynamic navigation with smooth animations and responsive hamburger menu
- Blog pages organized as an educational journey (oldest to newest)
- Interactive code blocks that can be run in-browser with explanation modals
- Blog post editor with drag and drop content system
- Supabase integration for data storage

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS with the Typography plugin
- **Animation**: Framer Motion
- **Database**: Supabase
- **Code Highlighting**: React Syntax Highlighter
- **Icons**: React Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account with API keys

### Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

The blog requires the following tables in your Supabase database:

1. `blog_posts` - For storing blog post content
2. `research_papers` - For storing research papers

Check the `src/types/index.ts` file for the structure of these tables.

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the blog.

## Project Structure

- `src/app` - Next.js app router pages
- `src/components` - React components organized by feature
- `src/lib` - Utility functions and Supabase client
- `src/types` - TypeScript type definitions
- `public` - Static assets

## Creating Content

The blog includes an editor accessible at `/editor`. Use it to:

1. Create new blog posts in any category
2. Edit existing posts
3. Arrange content using drag and drop
4. Reorder posts within categories

## License

This project is licensed under the MIT License.

## Acknowledgments

- Geist fonts for typography
- Neo-brutalist design principles
- Next.js team for the amazing framework
