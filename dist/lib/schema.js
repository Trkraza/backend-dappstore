"use strict";
// D:\projects\dapp-store\backend-dappstore\lib\schema.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugsSchema = exports.appsMinSchema = exports.metaJsonSchema = void 0;
const zod_1 = require("zod");
// Schema for content within meta.json
const contentSchema = zod_1.z.object({
    short: zod_1.z.string().min(1, { message: "Content short description cannot be empty." }),
    description: zod_1.z.string().min(1, { message: "Content description cannot be empty." }),
    meta: zod_1.z.string().optional(), // Optional meta description
    pageTitle: zod_1.z.string().optional(), // Optional page title
});
// Schema for links within meta.json
const linkSchema = zod_1.z.object({
    website: zod_1.z.string().url().optional(),
    twitter: zod_1.z.string().url().optional(),
    github: zod_1.z.string().url().optional(),
    discord: zod_1.z.string().url().optional(),
    telegram: zod_1.z.string().url().optional(),
    // Add other social/external links as needed
});
// Schema for relations within meta.json
const relationSchema = zod_1.z.object({
// Define structure for relations if applicable, e.g.,
// relatedDapps: z.array(z.string()).optional(), // array of slugs
});
// Main schema for meta.json
exports.metaJsonSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1, { message: "Slug cannot be empty." }),
    name: zod_1.z.string().min(1, { message: "Name cannot be empty." }),
    logoUrl: zod_1.z.string().min(1, { message: "logoUrl cannot be empty." }), // Can be local path or CDN URL
    category: zod_1.z.string().min(1, { message: "Category cannot be empty." }),
    chains: zod_1.z.array(zod_1.z.string().min(1)).min(1, { message: "At least one chain must be specified." }),
    content: contentSchema,
    links: linkSchema.optional(),
    relations: relationSchema.optional(),
    // Add other top-level fields as needed
});
// Schema for the minified output (listing-specific fields only)
exports.appsMinSchema = zod_1.z.object({
    slug: zod_1.z.string(),
    name: zod_1.z.string(),
    logoUrl: zod_1.z.string().url(), // In minified output, it must be a CDN URL
    category: zod_1.z.string(),
    chains: zod_1.z.array(zod_1.z.string()),
    short: zod_1.z.string(), // Extracted from content.short
});
// Schema for slugs.json
exports.slugsSchema = zod_1.z.array(zod_1.z.string());
