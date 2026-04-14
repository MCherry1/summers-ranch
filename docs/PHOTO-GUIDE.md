# How to Add & Update Photos on the Summers Ranch Website

This guide explains how to add new photos to your website using GitHub.

---

## Where Photos Go

Your repo has an `images/` folder with subfolders for each purpose:

```
images/
├── hero/       ← Big landscape/banner photos (shown full-width across pages)
├── cattle/     ← Individual animal photos (one per animal, named by tag number)
├── gallery/    ← Any photos for the gallery page
├── about/      ← Family portraits and ranch story photos
├── mascot/     ← Junior Ranch Hand photos
└── icons/      ← Favicon and small graphics (you probably won't touch this)
```

## Photo Sizing Guidelines

| Folder    | Width    | Max File Size | Format        | Example                     |
|-----------|----------|---------------|---------------|-----------------------------|
| hero/     | 1920px   | 250 KB        | .jpg or .webp | `hero/ranch-sunset.jpg`     |
| cattle/   | 800px    | 100 KB        | .jpg or .webp | `cattle/tag-189.jpg`        |
| gallery/  | 1200px   | 200 KB        | .jpg or .webp | `gallery/spring-calves.jpg` |
| about/    | 800px    | 100 KB        | .jpg or .webp | `about/member-1.jpg`        |
| mascot/   | 800px    | 100 KB        | .jpg or .webp | `mascot/mascot-main.jpg`    |

**Why size matters:** GitHub Pages has a 1 GB limit for the whole site. A single unoptimized phone photo can be 5–10 MB. Resizing and compressing keeps the site fast and under budget.

## How to Resize Photos (Easy Way)

### Option A: Use Your Phone
Before uploading, most phones let you resize in the share/export settings. Look for "Small" or "Medium" size option.

### Option B: Free Online Tool
1. Go to **squoosh.app** (free, by Google, runs in your browser)
2. Drag your photo in
3. On the right side, set **Resize** width to 800 (or 1920 for hero images)
4. Set **Quality** to 80%
5. Download the result
6. The file should now be well under 200 KB

### Option C: Bulk Resize (if you have many photos)
On Mac/Linux, install `cwebp` and run:
```bash
# Resize to 800px wide, 80% quality, output as WebP
cwebp -q 80 -resize 800 0 input.jpg -o output.webp
```

## How to Upload Photos to GitHub

### Method 1: GitHub.com (Easiest — No Tools Needed)

1. Go to your repo: `github.com/MCherry1/mrsummersranch`
2. Click into the folder you want (e.g., `images/cattle/`)
3. Click **"Add file"** → **"Upload files"**
4. Drag your resized photos in (or click "choose your files")
5. At the bottom, type a short description like "Added photos for tag 189 and 247"
6. Click **"Commit changes"**
7. Wait 1–2 minutes — GitHub Pages will auto-deploy

### Method 2: GitHub Desktop App

1. Download GitHub Desktop from desktop.github.com
2. Clone your repo
3. Copy photos into the right `images/` subfolder on your computer
4. Open GitHub Desktop — it will show the new files
5. Type a summary and click **"Commit to main"**
6. Click **"Push origin"**

### Method 3: Git Command Line (if you're comfortable)

```bash
cd summers-ranch
cp ~/Desktop/new-cattle-photos/*.jpg images/cattle/
git add images/cattle/
git commit -m "Added new cattle photos"
git push
```

## Naming Conventions

- **Cattle photos:** `tag-XXX.jpg` (e.g., `tag-189.jpg`, `tag-247.jpg`)
- **Hero images:** Descriptive names (e.g., `ranch-sunrise.jpg`, `herd-pasture.jpg`)
- **Gallery photos:** Descriptive names (e.g., `spring-calves-2026.jpg`)
- **Family portraits:** `member-1.jpg`, `member-2.jpg` or names (e.g., `john.jpg`)
- **Mascot photos:** `mascot-main.jpg`, `mascot-feeding.jpg`, etc.

**Rules:** Use lowercase, no spaces (use hyphens instead), and keep names short.

## After Uploading

Once you push photos to the repo, GitHub Pages automatically rebuilds the site within 1–2 minutes. Refresh mrsummersranch.com to see the changes.

If a photo isn't showing up, double-check:
1. The filename matches what's in the HTML code
2. The photo is in the correct subfolder
3. You've waited a couple minutes for deployment

---

## Easiest Method: The Ranch Photos Shortcut

Install the iPhone shortcut: [Tap here on your iPhone](https://www.icloud.com/shortcuts/d43741765d9c4b95bc48484ebbc3cc74)

Pick General, Cattle, or Hunting → select photos → done. The server handles resizing, organizing, and updating the site automatically.

See `docs/IOS-SHORTCUT-GUIDE.md` for full details.
