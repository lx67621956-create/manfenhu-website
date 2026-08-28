import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.union([z.string(), z.date()]).transform(v =>
      typeof v === 'object' ? v.toISOString().split('T')[0] : v
    ),
    category: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
  }),
});

export const collections = {
  news: newsCollection,
};
