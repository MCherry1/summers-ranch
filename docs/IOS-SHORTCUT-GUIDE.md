# Upload Ranch Photos to GitHub — iOS Shortcut Guide

This shortcut lets you select photos from your iPhone, resize and compress them automatically, then upload directly to the Summers Ranch GitHub repo. One tap.

---

## What You Need First

1. **A GitHub Personal Access Token (PAT)** with `repo` scope
   - Go to: github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
   - Repository access: select `MCherry1/summers-ranch` only
   - Permissions: Contents → Read and Write
   - Copy the token — you'll paste it into the shortcut once

2. **The Shortcuts app** on your iPhone (it's built in)

---

## Build the Shortcut: Step by Step

Open the Shortcuts app → tap **+** to create a new shortcut → name it **"Ranch Photo Upload"**

### Action 1: Choose from Menu
- Add: **Choose from Menu**
- Prompt: `Upload photos to which folder?`
- Options (add one per line):
  - `Cattle`
  - `Gallery`
  - `Hero`
  - `About`
  - `Mascot`

For each menu item, set a **Text** action with the folder path:
- Cattle → `images/cattle`
- Gallery → `images/gallery`
- Hero → `images/hero`
- About → `images/about`
- Mascot → `images/mascot`

Save the result to a variable called **FolderPath**.

### Action 2: Select Photos
- Add: **Select Photos**
- Turn ON **Select Multiple**

### Action 3: Repeat with Each (photo loop)
- Add: **Repeat with Each** on the Selected Photos

Inside the repeat loop, add these actions:

### Action 4: Resize Image
- Add: **Resize Image**
- Width: choose based on folder (or use 800 as a default)
  - For Hero photos you might want 1920, but 800 works fine for everything else to start
- Height: **Auto**

### Action 5: Convert Image
- Add: **Convert Image**
- Format: **JPEG**
- Quality: **80%** (good balance of quality vs file size)
- Preserving Metadata: **OFF** (strips GPS/location data — good for privacy)

### Action 6: Generate Filename
- Add: **Format Date**
- Date: **Current Date**
- Format: **Custom** → `yyyyMMdd-HHmmss`
- Save to variable **Timestamp**

- Add: **Text**
- Content: `photo-[Timestamp].jpg`
- Save to variable **Filename**

*Alternatively, for cattle photos, you could add an "Ask for Input" to type the tag number and use `tag-[input].jpg`*

### Action 7: Base64 Encode
- Add: **Base64 Encode**
- Input: the converted image from Action 5
- Line Break: **None** (IMPORTANT — the GitHub API breaks if there are line breaks)

Save to variable **EncodedImage**

### Action 8: Build the JSON Body
- Add: **Text** action with this content:

```
{"message":"Add photo [Filename]","content":"[EncodedImage]"}
```

(Use the variable tokens — tap the variable names from the bar above the keyboard)

Save to variable **RequestBody**

### Action 9: Upload to GitHub
- Add: **Get Contents of URL**
- URL: `https://api.github.com/repos/MCherry1/summers-ranch/contents/[FolderPath]/[Filename]`
  (Insert the FolderPath and Filename variables into the URL)
- Method: **PUT**
- Headers:
  - `Authorization` → `Bearer YOUR_PAT_TOKEN_HERE`
  - `Accept` → `application/vnd.github+json`
  - `Content-Type` → `application/json`
- Request Body: **File** → select the RequestBody variable

### Action 10: Check Result
- Add: **If**
- Input: Result of Get Contents of URL
- Contains: `"content"`
- Then: **Show Notification** → "✅ Uploaded [Filename]"
- Otherwise: **Show Notification** → "❌ Upload failed — check the result"

### End of Repeat Loop

That's it. End the **Repeat with Each** block.

---

## How to Use It

1. Tap the shortcut (or add it to your Home Screen)
2. Pick a folder (Cattle, Gallery, etc.)
3. Select one or more photos from your library
4. Wait a few seconds per photo
5. Done — photos are live on GitHub, site rebuilds in ~2 minutes

---

## Tips & Gotchas

**File size limit:** GitHub's Contents API has a **25 MB limit** per file. At 80% JPEG quality and 800px width, your photos will typically be 50–150 KB, so this is never an issue.

**Repo size:** GitHub Pages repos should stay under 1 GB. At ~100 KB per photo, you can fit roughly 10,000 photos before worrying. You're fine.

**Base64 line breaks:** The most common failure is the base64 string containing `\n` characters. Make sure the Base64 Encode action's Line Break setting is **None**.

**Overwriting files:** If you upload a file with the same name as an existing one, the API will return an error (422). Either use unique timestamps in filenames (which the shortcut does) or add logic to fetch the existing file's SHA first.

**Privacy:** The Convert Image action with "Preserving Metadata: OFF" strips EXIF data including GPS coordinates. This is important — you don't want your ranch's precise GPS location embedded in every photo on a public website.

**PAT security:** The PAT is stored inside the shortcut. It only has write access to this one repo. You can revoke it anytime from GitHub settings. Consider creating a dedicated PAT just for this shortcut with minimal permissions.

---

## Advanced: Cattle Tag Prompt (Multi-Photo)

For cattle photos specifically, you might want a version that asks for the tag number and photo number:

After Action 2 (Select Photos), add:
- **If** FolderPath contains `cattle`
  - **Ask for Input**: `Enter tag number (e.g., 189)`
  - Save to variable **TagNumber**
  - **Ask for Input**: `Photo number or description (e.g., 1, 2, front, side)`
  - Save to variable **PhotoLabel**
  - Set Filename to: `tag-[TagNumber]-[PhotoLabel].jpg`
- **Otherwise**
  - Use the timestamp filename

This way cattle photos are named `tag-189-1.jpg`, `tag-189-front.jpg`, etc. The first photo (`-1`) becomes the primary card image on the site, and the rest show up in a mini gallery when clicking the card.

---

## Quick Test

Before using it for real, test with one photo:
1. Run the shortcut
2. Pick "Gallery"
3. Select one photo
4. Check github.com/MCherry1/summers-ranch — you should see the new file in `images/gallery/`
5. The site will rebuild on its own within a couple minutes

---

## Alternative: Share Sheet Integration

You can also set this shortcut to appear in the **Share Sheet**:
1. Open the shortcut settings (tap the ⓘ)
2. Turn on **Show in Share Sheet**
3. Set Input: **Images**

Now when you're in the Photos app, you can select photos → tap Share → tap "Ranch Photo Upload" → pick a folder → done. Even faster.
