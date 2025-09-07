import { defineCollection, z } from 'astro:content';

const journalCollection = defineCollection({
    schema: z.object({
        title: z.string(),
        date: z.string(),
        excerpt: z.string().optional(),
        tags: z.array(z.string()).default([]),
        categories: z.array(z.string()).default([]),
        featuredImage: z.string().optional(),
        published: z.boolean().default(true),
        author: z.string().default('Lukeus')
    })
});

export const collections = {
    journal: journalCollection
};
