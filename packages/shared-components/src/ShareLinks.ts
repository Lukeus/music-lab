import { ShareLinksConfig, SocialPlatform, ShareButton } from './types.js';

/**
 * ShareLinks - A reusable component for adding social sharing functionality to pages
 * 
 * Features:
 * - Native Web Share API integration with fallback
 * - Copy to clipboard functionality
 * - Social media sharing (Twitter, Facebook, LinkedIn)
 * - Customizable styling and configuration
 * - TypeScript with strict typing
 * 
 * Usage:
 * ```typescript
 * import { createShareLinks } from '@lukeus/shared-components';
 * 
 * const shareLinks = createShareLinks({
 *   title: 'My Page Title',
 *   description: 'Page description for sharing'
 * });
 * 
 * shareLinks.init();
 * ```
 */
export class ShareLinks {
  private config: Required<ShareLinksConfig>;
  private container: HTMLElement | null = null;
  private isInitialized = false;

  private static readonly DEFAULT_CONFIG: Required<ShareLinksConfig> = {
    title: '',
    description: '',
    url: '',
    containerSelector: '.post-share',
    showNativeShare: true,
    showCopyLink: true,
    showSocialButtons: true,
    cssClasses: []
  };

  private static readonly SOCIAL_BUTTONS: ShareButton[] = [
    { platform: 'twitter', label: '𝕏 Twitter', icon: '𝕏' },
    { platform: 'facebook', label: 'f Facebook', icon: 'f' },
    { platform: 'linkedin', label: 'in LinkedIn', icon: 'in' }
  ];

  constructor(config: ShareLinksConfig = {}) {
    this.config = { ...ShareLinks.DEFAULT_CONFIG, ...config };
    
    // Set defaults from page if not provided
    if (!this.config.title) {
      this.config.title = document.title;
    }
    if (!this.config.description) {
      this.config.description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    }
    if (!this.config.url) {
      this.config.url = window.location.href;
    }
  }

  /**
   * Initialize the ShareLinks component
   * Creates the share buttons and attaches event listeners
   */
  public init(): void {
    if (this.isInitialized) {
      console.warn('ShareLinks already initialized');
      return;
    }

    this.container = document.querySelector(this.config.containerSelector);
    
    if (!this.container) {
      // Create container if it doesn't exist
      this.createContainer();
    }

    if (this.container) {
      this.renderShareButtons();
      this.attachEventListeners();
      this.isInitialized = true;
    } else {
      console.error(`ShareLinks: Could not find or create container with selector: ${this.config.containerSelector}`);
    }
  }

  /**
   * Destroy the ShareLinks component
   * Removes event listeners and cleans up
   */
  public destroy(): void {
    if (!this.isInitialized || !this.container) return;

    this.removeEventListeners();
    this.isInitialized = false;
  }

  /**
   * Update the share data
   */
  public updateShareData(data: Partial<Pick<ShareLinksConfig, 'title' | 'description' | 'url'>>): void {
    Object.assign(this.config, data);
  }

  private createContainer(): void {
    // Try to find a suitable parent container
    const footer = document.querySelector('.blog-post-footer .container, footer .container, .container');
    if (footer) {
      const shareContainer = document.createElement('div');
      shareContainer.className = 'post-share';
      footer.appendChild(shareContainer);
      this.container = shareContainer;
    }
  }

  private renderShareButtons(): void {
    if (!this.container) return;

    const shareButtonsHtml = this.generateShareButtonsHtml();
    this.container.innerHTML = `
      <h3>Share this page</h3>
      <div class="share-buttons ${this.config.cssClasses.join(' ')}">
        ${shareButtonsHtml}
      </div>
    `;
  }

  private generateShareButtonsHtml(): string {
    let buttonsHtml = '';

    // Native share button
    if (this.config.showNativeShare) {
      buttonsHtml += '<button class="share-button" data-action="share">↗ Share</button>';
    }

    // Copy link button
    if (this.config.showCopyLink) {
      buttonsHtml += '<button class="share-button" data-action="copy">⧉ Copy</button>';
    }

    // Social media buttons
    if (this.config.showSocialButtons) {
      ShareLinks.SOCIAL_BUTTONS.forEach(button => {
        buttonsHtml += `
          <a class="share-button social-share" href="#" data-platform="${button.platform}" target="_blank" rel="noopener">
            ${button.label}
          </a>
        `;
      });
    }

    return buttonsHtml;
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Native share button
    const shareButton = this.container.querySelector('.share-button[data-action="share"]');
    if (shareButton) {
      shareButton.addEventListener('click', this.handleShare.bind(this));
    }

    // Copy button
    const copyButton = this.container.querySelector('.share-button[data-action="copy"]');
    if (copyButton) {
      copyButton.addEventListener('click', this.handleCopyLink.bind(this));
    }

    // Social share buttons
    const socialButtons = this.container.querySelectorAll('.social-share');
    socialButtons.forEach(button => {
      button.addEventListener('click', this.handleSocialShare.bind(this));
    });
  }

  private removeEventListeners(): void {
    if (!this.container) return;

    // Remove all event listeners by cloning and replacing the container
    const newContainer = this.container.cloneNode(true);
    this.container.parentNode?.replaceChild(newContainer, this.container);
    this.container = newContainer as HTMLElement;
  }

  private async handleShare(): Promise<void> {
    const shareButton = this.container?.querySelector('.share-button[data-action="share"]') as HTMLButtonElement;
    
    if (shareButton) {
      shareButton.classList.add('loading');
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: this.config.title,
          text: this.config.description,
          url: this.config.url
        });
        
        // Success feedback
        if (shareButton) {
          shareButton.classList.remove('loading');
          shareButton.classList.add('success-pulse');
          setTimeout(() => shareButton.classList.remove('success-pulse'), 600);
        }
      } catch (error) {
        console.log('Share failed:', error);
        if (shareButton) {
          shareButton.classList.remove('loading');
        }
        // Fallback to copy
        this.copyToClipboard();
      }
    } else {
      if (shareButton) {
        shareButton.classList.remove('loading');
      }
      this.copyToClipboard();
    }
  }

  private handleCopyLink(): void {
    this.copyToClipboard();
  }

  private handleSocialShare(event: Event): void {
    event.preventDefault();
    
    const target = event.currentTarget as HTMLElement;
    const platform = target.getAttribute('data-platform') as SocialPlatform;
    
    if (!platform) return;

    // Add loading state
    target.classList.add('loading');

    const url = encodeURIComponent(this.config.url);
    const title = encodeURIComponent(this.config.title);
    const description = encodeURIComponent(this.config.description);

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
    }

    if (shareUrl) {
      // Open share window
      const shareWindow = window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      
      // Remove loading state after a short delay
      setTimeout(() => {
        target.classList.remove('loading');
        target.classList.add('success-pulse');
        setTimeout(() => target.classList.remove('success-pulse'), 600);
      }, 300);
      
      // Add haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } else {
      target.classList.remove('loading');
    }
  }

  private async copyToClipboard(): Promise<void> {
    const copyButton = this.container?.querySelector('.share-button[data-action="copy"]') as HTMLButtonElement;
    
    try {
      await navigator.clipboard.writeText(this.config.url);
      this.showCopyFeedback(copyButton, '✅ Copied!');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      this.fallbackCopyToClipboard();
      this.showCopyFeedback(copyButton, '✅ Copied!');
    }
  }

  private fallbackCopyToClipboard(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.config.url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  private showCopyFeedback(button: HTMLButtonElement | null, message: string): void {
    if (!button) return;

    const originalText = button.textContent;
    button.textContent = message;
    button.disabled = true;
    
    // Add visual feedback classes
    button.classList.add('copied', 'success-pulse');
    
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.classList.remove('copied', 'success-pulse');
    }, 2000);
  }
}

/**
 * Factory function to create a ShareLinks instance
 * This is the recommended way to create ShareLinks components
 */
export function createShareLinks(config?: ShareLinksConfig): ShareLinks {
  return new ShareLinks(config);
}

/**
 * Initialize ShareLinks with auto-detection
 * Automatically finds share containers and initializes ShareLinks
 */
export function initAutoShareLinks(config?: ShareLinksConfig): ShareLinks[] {
  const containers = document.querySelectorAll('.post-share, .page-share, .share-container');
  const instances: ShareLinks[] = [];

  containers.forEach((container, index) => {
    const customConfig: ShareLinksConfig = {
      ...config,
      containerSelector: `.share-container-${index}`
    };

    // Add unique class to container
    container.classList.add(`share-container-${index}`);

    const shareLinks = createShareLinks(customConfig);
    shareLinks.init();
    instances.push(shareLinks);
  });

  return instances;
}
