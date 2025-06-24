# Images Directory

## Profile Image Setup

1. **Add your professional photo to this directory**
2. **Name it exactly**: `profile.jpg`
3. **Recommended specifications**:
   - **Format**: JPG or PNG
   - **Size**: 400x400px to 800x800px
   - **Aspect Ratio**: Square (1:1) preferred
   - **File Size**: Under 500KB for optimal loading

## Image Requirements

- **Professional appearance**: Business casual or formal attire
- **Good lighting**: Clear, well-lit photo
- **Background**: Plain or professional background preferred
- **Quality**: High resolution, not pixelated
- **Orientation**: Portrait or square orientation

## Alternative Setup

If you want to use a different filename or format:

1. Update the image source in `index.html`
2. Find this line in the About section:
   ```html
   <span class="image main"
     ><img src="assets/images/profile.jpg" alt="Aryan Patel"
   /></span>
   ```
3. Change `profile.jpg` to your filename

## Supported Formats

- **JPG/JPEG**: Best for photographs
- **PNG**: Good for images with transparency
- **WebP**: Modern format for better compression (if browser support is not a concern)

## Image Optimization Tips

- Compress images to reduce file size
- Use appropriate dimensions (don't use oversized images)
- Consider using WebP format for better performance
- Add descriptive alt text for accessibility

## Fallback

If no image is provided, you can:

1. Remove the image line from the About section
2. Or use a placeholder/avatar service
3. Or use a professional icon instead
