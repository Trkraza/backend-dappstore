import { z } from 'zod';

// Schema for a single DApp
export const dappSchema = z.object({
  slug: z.string().min(1, { message: "Slug cannot be empty." }),
  name: z.string().min(1, { message: "Name cannot be empty." }),
  description: z.string().optional(),
  url: z.string().url({ message: "Invalid URL format." }),
  logo: z.string().min(1, { message: "Logo path/URL cannot be empty." }),
  category: z.string().min(1, { message: "Category cannot be empty." }),
  chain: z.string().min(1, { message: "Chain cannot be empty." }),
});

// Schema for the master.json file (an array of DApps)
export const masterSchema = z.array(dappSchema);

// Type inference for easy use in our app
export type DApp = z.infer<typeof dappSchema>;
