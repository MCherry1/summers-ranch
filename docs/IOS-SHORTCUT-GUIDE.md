# Upload Ranch Photos to GitHub — iOS Shortcut Guide

Select photos on your iPhone, pick a category, and they upload automatically.

**Install the shortcut directly:** [Tap here on your iPhone](https://www.icloud.com/shortcuts/d43741765d9c4b95bc48484ebbc3cc74)

Or build it yourself using the steps below. A GitHub Actions pipeline handles all the heavy lifting — resizing, compressing, stripping GPS data, and organizing into the right folders. Your phone just uploads.

---

## What You Need First

1. **A GitHub Personal Access Token (PAT)** with `repo` scope
   - Go to: github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
   - Repository access: select `MCherry1/summers-ranch` only
   - Permissions: Contents → Read and Write
   - Set expiration to 1 year
   - Copy the token — you'll paste it into the shortcut once

2. **The Shortcuts app** on your iPhone (it's built in)

---

## How It Works

```
Phone                          GitHub (automatic)
─────                          ──────────────────
Pick category (General/        GitHub Actions triggers:
  Cattle/Hunting)              → Resize to 1200px
Select photos                  → Upload raw
Strip GPS data (fast)          → Compress to JPEG 82%
Upload to images/inbox/        → Route to correct folder
Done ✓                         → Auto-number cattle photos
                               → Commit changes
                               → Site rebuilds (~2 min)
```

You don't resize on the phone. You don't pick folders. The server does all of that.

---

## Build the Shortcut: Step by Step

Open the Shortcuts app → tap **+** → name it **"Ranch Photos"**

### Action 1: Choose from Menu
- Add: **Choose from Menu**
- Prompt: `What kind of photos?`
- Add three options: `General`, `Cattle`, `Hunting`

### Inside "Cattle":

- Add: **Ask for Input**
  - Prompt: `Tag number?`
  - Input Type: **Text**
- Save to variable **TagNumber**
- Add: **Text**: `cattle-tag-[TagNumber]`
  (tap TagNumber variable from the bar above keyboard)
- Save to variable **Prefix**

### Inside "Hunting":

- Add: **Text**: `hunting`
- Save to variable **Prefix**

### Inside "General":

- Add: **Text**: `photo`
- Save to variable **Prefix**

### After the menu (back in the main flow):

### Action 2: Select Photos
- Add: **Select Photos**
- Turn ON **Select Multiple**

### Action 3: Repeat with Each
- Add: **Repeat with Each** on the Selected Photos

Inside the repeat loop:

### Action 4: Convert Image (JPEG, preserve metadata)
- Add: **Convert Image**
- Format: **JPEG**
- Quality: **80%**
- Preserving Metadata: **ON**

This preserves the photo date for the timeline. The server strips GPS and other private metadata — your location stays safe.

### Action 5: Generate Filename
- Add: **Format Date**
  - Date: **Current Date**
  - Format: **Custom** → `yyyyMMdd-HHmmss`
- Save to variable **Timestamp**

- Add: **Text**: `[Prefix]-[Timestamp].jpg`
  (tap the variables from the bar above the keyboard)
- Save to variable **Filename**

This creates filenames like:
- `photo-20260413-192500.jpg` (general)
- `cattle-tag-189-20260413-192500.jpg` (cattle)
- `hunting-20260413-192500.jpg` (hunting)

### Action 6: Base64 Encode
- Add: **Base64 Encode**
- Input: the converted image from Action 4
- **Line Break: None** ← IMPORTANT — the upload breaks without this

Save to variable **EncodedImage**

### Action 7: Build JSON Body
- Add: **Text**:

```
{"message":"Add [Filename]","content":"[EncodedImage]"}
```

(Use the variable tokens — tap Filename and EncodedImage from the bar)

Save to variable **RequestBody**

### Action 8: Upload to GitHub
- Add: **Get Contents of URL**
- URL: `https://api.github.com/repos/MCherry1/summers-ranch/contents/images/inbox/[Filename]`
  (Insert the Filename variable into the URL)
- Method: **PUT**
- Headers:
  - `Authorization` → `Bearer YOUR_PAT_TOKEN_HERE`
  - `Accept` → `application/vnd.github+json`
  - `Content-Type` → `application/json`
- Request Body: **File** → select the RequestBody variable

**Note:** Everything goes to `images/inbox/` — the pipeline sorts it from there.

### Action 9: Notification
- Add: **Show Notification** → `✅ Uploaded [Filename]`

### End of Repeat Loop

That's the whole shortcut.

---

## What Happens After Upload

The GitHub Actions pipeline (`.github/workflows/process-photos.yml`) triggers automatically:

1. **Cattle photos** (`cattle-tag-189-...`): Resized, stripped, moved to `images/cattle/tag-189-1.jpg`. If `tag-189-1.jpg` already exists, it becomes `tag-189-2.jpg`, then `-3`, etc. You never have to track the numbering — it's automatic.

2. **Hunting photos** (`hunting-...`): Resized, stripped, moved to `images/hunting/` with a clean date-based name.

3. **General photos** (`photo-...`): If the Claude API key is set up, the photo gets analyzed and categorized automatically (cattle → cattle folder, family → gallery, landscape → gallery, etc.). If no API key, it just goes to `images/gallery/`.

All photos are resized to max 1200px wide, compressed to JPEG quality 82, and have all metadata stripped.

---

## How to Use It

1. Tap the shortcut (or use from the Share Sheet)
2. Pick: General, Cattle, or Hunting
3. If Cattle: type the tag number
4. Select one or more photos
5. Wait for the uploads (a few seconds each)
6. Done — the pipeline handles the rest

---

## Tips

**Speed:** The shortcut is fast because it's not resizing on your phone. The only processing is the JPEG conversion, which takes under a second per photo. Metadata (including the photo date) is preserved — the server strips GPS data later. The upload time depends on your cell signal.

**Cattle tag numbers:** Just enter the number — the pipeline handles the `-1`, `-2`, `-3` numbering automatically based on what already exists in the repo. Upload 5 photos of tag 189 in a row and they'll become `tag-189-1.jpg` through `tag-189-5.jpg`.

**Base64 line breaks:** The most common upload failure. Make sure the Base64 Encode action's Line Break setting is **None**.

**File size limit:** GitHub's API has a 25 MB per-file limit. Even unresized iPhone photos are typically 5-10 MB, so you're well within limits. The pipeline will shrink them on the server.

**PAT security:** The PAT is stored inside the shortcut. It only has write access to this one repo. You can revoke it anytime from GitHub Settings → Developer settings → Personal access tokens. Fine-grained PATs scoped to a single repo are about as safe as it gets.

**Sharing the shortcut:** You can share this shortcut with Marty and Roianne. The PAT inside it lets their phones upload directly to the repo. If a phone is lost, revoke the PAT from GitHub and create a new one.

---

## Share Sheet Integration

To use this from the Photos app directly:
1. Open the shortcut settings (tap the ⓘ icon)
2. Turn on **Show in Share Sheet**
3. Set accepted types to **Images**

Now: Photos app → select photos → Share → "Ranch Photos" → pick category → done.

---

## Quick Test

1. Run the shortcut
2. Pick "General"
3. Select one photo
4. Wait for the ✅ notification
5. Go to github.com/MCherry1/summers-ranch
6. Check `images/inbox/` — your photo should be there
7. Wait a few minutes — GitHub Actions will process it and move it to `images/gallery/`
8. Check the Actions tab to see the workflow run
