// Blog utility functions

/**
 * Calculate estimated reading time for content
 * @param content - The markdown/text content
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Average reading speed
    const words = content.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return Math.max(1, time); // Minimum 1 minute
}

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Generate excerpt from content if not provided
 * @param content - The full content
 * @param maxLength - Maximum length of excerpt
 * @returns Generated excerpt
 */
export function generateExcerpt(
    content: string,
    maxLength: number = 160
): string {
    // Remove markdown formatting for excerpt
    const plainText = content
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .trim();

    if (plainText.length <= maxLength) return plainText;

    // Find the last complete word within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '…';
}

/**
 * Create URL slug from title
 * @param title - Post title
 * @returns URL-safe slug
 */
export function createSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
