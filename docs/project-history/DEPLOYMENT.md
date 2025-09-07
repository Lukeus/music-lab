# Deployment Guide

This guide covers deploying the Lukeus Music Lab website to various hosting platforms.

## GitHub Pages (Recommended)

### Setup
1. **Push to GitHub**
```bash
git remote add origin https://github.com/lukeus/music-lab.git
git push -u origin main
```

2. **Enable GitHub Pages**
- Go to repository Settings
- Navigate to Pages section
- Set source to "Deploy from a branch"
- Select "main" branch and "/ (root)" folder
- Save settings

3. **Custom Domain** (Optional)
- Add `CNAME` file with your domain
- Configure DNS with your domain provider

### Automatic Deployment
Any push to the main branch will trigger automatic deployment.

## Netlify

### Manual Deployment
1. **Build for Production**
```bash
# No build step needed for static site
zip -r music-lab.zip . -x "node_modules/*" ".git/*"
```

2. **Deploy to Netlify**
- Go to [netlify.com](https://netlify.com)
- Drag and drop the project folder
- Or connect GitHub repository for automatic deployments

### Automatic Deployment
1. Connect GitHub repository
2. Set build command: `echo "No build required"`
3. Set publish directory: `.` (root)
4. Deploy automatically on push

## Vercel

### Using Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Using Git Integration
1. Import project from GitHub at [vercel.com](https://vercel.com)
2. No build configuration needed
3. Automatic deployments on push

## Traditional Web Hosting

### File Transfer
1. **Prepare Files**
```bash
# Create deployment package
zip -r deployment.zip . -x "node_modules/*" ".git/*" "docs/*"
```

2. **Upload via FTP/SFTP**
- Upload all files to web root
- Ensure `index.html` is in the root directory
- Set proper file permissions

### Required Files for Hosting
- `index.html`
- `css/styles.css`
- `js/main.js`
- `assets/` directory
- `.htaccess` (for Apache servers)

## CDN Setup

### Cloudflare
1. Add your domain to Cloudflare
2. Configure DNS records
3. Enable caching for static assets
4. Set up page rules for performance

### Performance Optimization
```apache
# .htaccess for Apache servers
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

## Environment Configuration

### Production Optimizations
- Minify CSS and JavaScript
- Optimize images
- Enable gzip compression
- Set up proper cache headers

### Analytics Setup
Add Google Analytics or similar:
```html
<!-- Add to <head> section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';">
```

### HTTPS Setup
- Always use HTTPS in production
- Most hosting platforms provide free SSL certificates
- Configure redirects from HTTP to HTTPS

## Monitoring and Maintenance

### Performance Monitoring
- Set up Google PageSpeed Insights monitoring
- Use Lighthouse CI for automated performance testing
- Monitor Core Web Vitals

### Uptime Monitoring
- Use services like UptimeRobot or Pingdom
- Set up alerts for downtime
- Monitor from multiple geographic locations

### Regular Maintenance
- Keep dependencies updated
- Monitor for broken links
- Review and update content regularly
- Backup content and configurations

## Troubleshooting

### Common Issues
- **404 errors**: Check file paths and server configuration
- **CSS not loading**: Verify MIME types and file permissions
- **Slow loading**: Optimize images and enable compression

### Debug Commands
```bash
# Test local server
npm run dev

# Validate HTML
npx html-validate index.html

# Check for broken links
npx broken-link-checker http://localhost:3000
```
