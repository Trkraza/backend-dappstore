// D:\projects\dapp-store\backend-dappstore\lib\schema.ts

import { z } from 'zod';

// Schema for content within meta.json
const contentSchema = z.object({
  short: z.string().min(1, { message: "Content short description cannot be empty." }),
  description: z.string().min(1, { message: "Content description cannot be empty." }),
  meta: z.string().optional(), // Optional meta description
  pageTitle: z.string().optional(), // Optional page title
});

// Schema for links within meta.json
const linkSchema = z.object({
  website: z.string().url().optional(),
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  discord: z.string().url().optional(),
  telegram: z.string().url().optional(),
  // Add other social/external links as needed
});

// Schema for relations within meta.json
const relationSchema = z.object({
  // Define structure for relations if applicable, e.g.,
  // relatedDapps: z.array(z.string()).optional(), // array of slugs
});

// Main schema for meta.json
export const metaJsonSchema = z.object({
  slug: z.string().min(1, { message: "Slug cannot be empty." }),
  name: z.string().min(1, { message: "Name cannot be empty." }),
  logoUrl: z.string().min(1, { message: "logoUrl cannot be empty." }), // Can be local path or CDN URL
  category: z.string().min(1, { message: "Category cannot be empty." }),
  chains: z.array(z.string().min(1)).min(1, { message: "At least one chain must be specified." }),
  content: contentSchema,
  links: linkSchema.optional(),
  relations: relationSchema.optional(),
  // Add other top-level fields as needed
});

// Type inference for easy use in our app
export type MetaJson = z.infer<typeof metaJsonSchema>;

// Schema for the minified output (listing-specific fields only)
export const appsMinSchema = z.object({
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().url(), // In minified output, it must be a CDN URL
  category: z.string(),
  chains: z.array(z.string()),
  short: z.string(), // Extracted from content.short
});

export type AppsMin = z.infer<typeof appsMinSchema>;

// Schema for slugs.json
export const slugsSchema = z.array(z.string());

export type Slugs = z.infer<typeof slugsSchema>;