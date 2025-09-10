/**
 * Configuration options for ShareLinks component
 */
export interface ShareLinksConfig {
  /** Custom title for sharing (defaults to document.title) */
  title?: string;
  /** Custom description for sharing (defaults to meta description) */
  description?: string;
  /** Custom URL for sharing (defaults to window.location.href) */
  url?: string;
  /** CSS selector for the container to append share buttons to */
  containerSelector?: string;
  /** Whether to show the native share button (if supported) */
  showNativeShare?: boolean;
  /** Whether to show the copy link button */
  showCopyLink?: boolean;
  /** Whether to show social media share buttons */
  showSocialButtons?: boolean;
  /** Custom CSS classes to apply to the share buttons container */
  cssClasses?: string[];
}

/**
 * Supported social media platforms for sharing
 */
export type SocialPlatform = 'twitter' | 'facebook' | 'linkedin';

/**
 * Share button configuration
 */
export interface ShareButton {
  platform: SocialPlatform;
  label: string;
  icon: string;
}
