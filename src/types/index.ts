export enum BlogCategory {
  FINANCE = "finance",
  AI_ML = "ai-ml",
  MATHEMATICS = "mathematics",
}

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

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  subject_id: string;
  category: BlogCategory;
  tags: string[];
  content: BlogContent[];
  createdAt: string;
  updatedAt: string;
  order?: number;
}

export enum ContentType {
  TEXT = "text",
  IMAGE = "image",
  CODE = "code",
}

export interface TextContent {
  type: ContentType.TEXT;
  id: string;
  text: string;
  postSlug?: string;
  gridColumn?: string;
}

export interface ImageContent {
  type: ContentType.IMAGE;
  id: string;
  src: string;
  alt: string;
  caption?: string;
  gridColumn?: string;
}

export interface CodeContent {
  type: ContentType.CODE;
  id: string;
  code: string;
  language: string;
  explanation: string;
  gridColumn?: string;
}

export type BlogContent = TextContent | ImageContent | CodeContent;

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  pdfUrl: string;
  publishedDate: string;
  tags: string[];
}
