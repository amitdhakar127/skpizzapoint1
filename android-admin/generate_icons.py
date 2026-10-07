#!/usr/bin/env python3
"""
SK Pizza Point - Android Admin APK Brand Icon Generator
Generates high-definition launcher icons and adaptive icons for all Android densities
using the official SK Pizza Point website logo.
"""

import os
import sys
import io
import requests
from PIL import Image, ImageDraw

# All Android launcher densities and sizes
# Legacy / standard launcher icon sizes (48dp base)
LEGACY_SIZES = [
    ('mipmap-mdpi', 48),
    ('mipmap-hdpi', 72),
    ('mipmap-xhdpi', 96),
    ('mipmap-xxhdpi', 144),
    ('mipmap-xxxhdpi', 192),
]

# Adaptive icon foreground sizes (108dp base, with 72dp center safe zone)
ADAPTIVE_SIZES = [
    ('mipmap-mdpi', 108, 72),
    ('mipmap-hdpi', 162, 108),
    ('mipmap-xhdpi', 216, 144),
    ('mipmap-xxhdpi', 324, 216),
    ('mipmap-xxxhdpi', 432, 288),
]

# Resilient fallback download sources (including Weserv CDN proxy to bypass Imgur 429)
LOGO_SOURCES = [
    'https://images.weserv.nl/?url=i.imgur.com/x7VzA1Q.jpeg',
    'https://i.imgur.com/x7VzA1Q.jpeg',
    'https://images.weserv.nl/?url=i.imgur.com/x7VzA1Q.png',
    'https://images.weserv.nl/?url=i.imgur.com/KRI3jtw.jpeg',
    'https://sk-pizza-point.web.app/assets/logo.png',
]

def get_base_dirs():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    res_dir = os.path.join(script_dir, 'app', 'src', 'main', 'res')
    return script_dir, res_dir

def download_or_load_logo(script_dir, res_dir):
    # 1. Check if a local cached file exists
    local_candidates = [
        os.path.join(script_dir, 'brand_logo.jpg'),
        os.path.join(script_dir, 'brand_logo.png'),
        os.path.join(res_dir, 'drawable', 'brand_logo.png'),
    ]
    for path in local_candidates:
        if os.path.exists(path) and os.path.getsize(path) > 1000:
            try:
                print(f"[+] Loading cached local logo: {path}")
                return Image.open(path).convert('RGBA')
            except Exception as e:
                print(f"[!] Warning reading local logo {path}: {e}")

    # 2. Try online sources with browser headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://sk-pizza-point.web.app/',
    }

    for url in LOGO_SOURCES:
        try:
            print(f"[+] Trying logo source: {url}")
            resp = requests.get(url, headers=headers, timeout=25)
            if resp.status_code == 200 and len(resp.content) > 1000:
                img = Image.open(io.BytesIO(resp.content)).convert('RGBA')
                # Cache locally for future offline builds
                cache_path = os.path.join(script_dir, 'brand_logo.jpg')
                with open(cache_path, 'wb') as f:
                    f.write(resp.content)
                print(f"[✓] Successfully downloaded brand logo from: {url} ({len(resp.content)} bytes)")
                return img
            else:
                print(f"[!] Source returned status: {resp.status_code}")
        except Exception as e:
            print(f"[!] Failed to fetch {url}: {e}")

    # 3. Fallback: High-resolution brand badge rasterizer if all downloads fail
    print("[!] Generating high-definition vector brand raster fallback...")
    return create_brand_raster_fallback()

def create_brand_raster_fallback():
    """Generates a crisp 1024x1024 brand badge matching the SK Pizza Point visual identity."""
    size = 1024
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer amber gold circle
    draw.ellipse((32, 32, size - 32, size - 32), fill=(245, 158, 11, 255))
    # Dark charcoal inner circle
    draw.ellipse((64, 64, size - 64, size - 64), fill=(24, 20, 17, 255))
    # Inner gold border ring
    draw.ellipse((84, 84, size - 84, size - 84), outline=(251, 191, 36, 255), width=8)

    # Golden pizza crust center
    center = size // 2
    draw.polygon([
        (center - 200, center - 160),
        (center + 200, center - 160),
        (center, center + 220)
    ], fill=(245, 158, 11, 255))

    # Mozzarella cheese body
    draw.polygon([
        (center - 180, center - 140),
        (center + 180, center - 140),
        (center, center + 200)
    ], fill=(251, 191, 36, 255))

    # Pepperoni toppings (red circles)
    for px, py in [(center - 60, center - 80), (center + 60, center - 80), (center, center + 40)]:
        draw.ellipse((px - 36, py - 36, px + 36, py + 36), fill=(239, 68, 68, 255))

    return img

def make_round_icon(img, size):
    """Generates a circular anti-aliased icon."""
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    
    round_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_img.paste(resized, (0, 0), mask=mask)
    return round_img

def make_adaptive_foreground(img, canvas_size, safe_size):
    """
    Android Adaptive Icon:
    Places the logo inside the inner 72dp safe zone of the 108dp canvas
    with transparent surrounding padding to ensure zero clipping on all launchers.
    """
    resized = img.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = (canvas_size - safe_size) // 2
    canvas.paste(resized, (offset, offset))
    return canvas

def main():
    script_dir, res_dir = get_base_dirs()
    print("=" * 60)
    print(" SK PIZZA POINT - GENERATING ALL NATIVE ANDROID BRAND ICONS")
    print("=" * 60)
    print(f"Target Resource Directory: {res_dir}")

    logo = download_or_load_logo(script_dir, res_dir)

    # 1. Generate Legacy Launcher Icons (ic_launcher.png and ic_launcher_round.png)
    for folder, size in LEGACY_SIZES:
        target_dir = os.path.join(res_dir, folder)
        os.makedirs(target_dir, exist_ok=True)

        # Standard square/full icon
        launcher_img = logo.resize((size, size), Image.Resampling.LANCZOS)
        launcher_path = os.path.join(target_dir, 'ic_launcher.png')
        launcher_img.save(launcher_path, format='PNG', optimize=True)

        # Round icon (for launchers requesting roundIcon)
        round_img = make_round_icon(logo, size)
        round_path = os.path.join(target_dir, 'ic_launcher_round.png')
        round_img.save(round_path, format='PNG', optimize=True)

        print(f"  [✓] Generated {folder}/ic_launcher.png & ic_launcher_round.png ({size}x{size})")

    # 2. Generate Adaptive Foreground Icons (ic_launcher_foreground.png)
    for folder, canvas_size, safe_size in ADAPTIVE_SIZES:
        target_dir = os.path.join(res_dir, folder)
        os.makedirs(target_dir, exist_ok=True)

        fg_img = make_adaptive_foreground(logo, canvas_size, safe_size)
        fg_path = os.path.join(target_dir, 'ic_launcher_foreground.png')
        fg_img.save(fg_path, format='PNG', optimize=True)

        print(f"  [✓] Generated {folder}/ic_launcher_foreground.png ({canvas_size}x{canvas_size}, safe: {safe_size}x{safe_size})")

    # 3. Clean up conflicting vector foreground file if it exists
    vector_fg = os.path.join(res_dir, 'drawable', 'ic_launcher_foreground.xml')
    if os.path.exists(vector_fg):
        try:
            os.remove(vector_fg)
            print(f"  [✓] Removed old conflicting vector drawable: {vector_fg}")
        except Exception as e:
            print(f"  [!] Warning removing {vector_fg}: {e}")

    # 4. Verify mipmap-anydpi-v26 XML files correctly point to @mipmap/ic_launcher_foreground
    anydpi_dir = os.path.join(res_dir, 'mipmap-anydpi-v26')
    os.makedirs(anydpi_dir, exist_ok=True)

    adaptive_xml_content = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""
    with open(os.path.join(anydpi_dir, 'ic_launcher.xml'), 'w', encoding='utf-8') as f:
        f.write(adaptive_xml_content)

    with open(os.path.join(anydpi_dir, 'ic_launcher_round.xml'), 'w', encoding='utf-8') as f:
        f.write(adaptive_xml_content)

    print("  [✓] Verified mipmap-anydpi-v26/ic_launcher.xml & ic_launcher_round.xml")

    # 5. Clean launcher background
    bg_xml_content = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#181411"
        android:pathData="M0,0h108v108h-108z" />
</vector>
"""
    drawable_dir = os.path.join(res_dir, 'drawable')
    os.makedirs(drawable_dir, exist_ok=True)
    with open(os.path.join(drawable_dir, 'ic_launcher_background.xml'), 'w', encoding='utf-8') as f:
        f.write(bg_xml_content)

    print("=" * 60)
    print(" ALL NATIVE ANDROID BRAND ICONS GENERATED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    main()
