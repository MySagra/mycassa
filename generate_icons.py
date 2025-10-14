#!/usr/bin/env python3
"""
Generate placeholder icons for PWA
Run this script to create basic colored icons in different sizes
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    
    def create_icon(size, filename):
        # Create image with orange background
        img = Image.new('RGB', (size, size), color='#f59e0b')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple "M" letter or keep it solid
        # For simplicity, just use solid color
        
        # Add rounded corners
        mask = Image.new('L', (size, size), 0)
        draw_mask = ImageDraw.Draw(mask)
        draw_mask.rounded_rectangle([(0, 0), (size, size)], radius=size//8, fill=255)
        
        # Apply mask
        output = Image.new('RGBA', (size, size))
        output.paste(img, (0, 0))
        output.putalpha(mask)
        
        # Save
        output.save(filename, 'PNG')
        print(f'Created {filename}')
    
    # Generate icons in different sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        create_icon(size, f'static/icon-{size}.png')
    
    print('\n✅ All icons generated successfully!')
    print('📝 Note: Replace these placeholder icons with your custom logo.')
    
except ImportError:
    print('❌ Pillow library not found.')
    print('Install it with: pip install Pillow')
    print('\nAlternatively, create icons manually:')
    print('- Use any image editor to create square PNG images')
    print('- Sizes needed: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512')
    print('- Save them as icon-72.png, icon-96.png, etc. in the static/ folder')
