/**
 * @lukeus/shared-components - Shared UI components for Lukeus Music Lab
 * 
 * This package provides reusable UI components following clean architecture principles
 * with TypeScript-first design and comprehensive type safety.
 */

// Export the main ShareLinks component and types
export { ShareLinks, createShareLinks, initAutoShareLinks } from './ShareLinks.js';
export type { ShareLinksConfig, SocialPlatform, ShareButton } from './types.js';

// Re-export everything for convenience
export * from './ShareLinks.js';
// Note: Don't re-export types.js at runtime since it contains only type definitions
