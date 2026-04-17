# Questions for Marty and Roianne

*A companion to the style preview — things to learn from them during the ranch visit that will materially affect the site's design.*

*The style preview (`/style-preview/`) asks them to pick a visual direction. This document asks them how they'll actually use the site. Both inputs shape what gets built.*

---

## How to use this document

These are genuine open questions where I've been making assumptions about Marty's behavior throughout the spec. Some of these assumptions may be right; some probably aren't. Better to learn the truth before the coding agent builds against the wrong mental model.

Don't feel obligated to work through this sequentially. Some of these are natural conversation ("do you actually want to see the site every day, or just when you need to?"); others are more specific ("would you use a feeding log if we built one?"). Use what's useful.

Each question is flagged with:
- **Who:** who to ask
- **Why it matters:** what design decision rides on the answer
- **If you can't ask:** what assumption we'll default to

If a question doesn't come up naturally or you can't get a clear answer, the default assumption is fine — the spec is designed to be forgiving of wrong guesses, and most of these can be revisited in Phase 2.

---

## Section A: How often and when Marty actually uses the site

These questions shape how prominent/lightweight various features should be, how we handle mobile vs. desktop priorities, and whether to invest in daily-use features vs. occasional-use ones.

### A1. How often will Marty actually want to open the site?

**Who:** Marty
**Why it matters:** The spec currently treats the admin herd view as something he visits periodically to update records. If he'd actually enjoy opening the site daily (seeing photos cycle, checking the herd, etc.), we should emphasize delightful-everyday features. If he'd open it monthly when needed, we should emphasize low-friction catch-up admin.
**If you can't ask:** default to "a few times a week" — enough to justify polish but not daily-engagement features.

**Follow-up if daily:** "Would you open it on the couch with your coffee, or in the field from your phone, or at your desk?" — answers about context affect mobile vs. desktop emphasis.

### A2. Does Marty want to log ranch activities at all?

**Who:** Marty (and maybe Roianne separately — she may have opinions about what gets logged)
**Why it matters:** The spec currently assumes admin activity is mostly animal-record updates (weaning weights, pregnancy status, photos). Matt's note raised the possibility of feeding logs, watering logs, pasture rotation notes — "ranch journaling." This is a whole feature category that isn't in the current spec.

Specific probes:
- "Do you keep a calendar or journal of ranch activities now? If so, in what form — paper, phone notes, nothing?"
- "Would you find it useful to log when you fed, watered, moved pastures, medicated an animal?"
- "Would you want others (Perry, Matt, a future hired hand) to see those logs?"

**If you can't ask:** default to NO ranch activity logging in Phase 1. Revisit in Phase 2 if it emerges as a real need.

### A3. Who else actually uses the ranch physically?

**Who:** Marty
**Why it matters:** Matt mentioned Perry (Marty's son) sometimes fills in — hay, water — when Marty's traveling. If there are regular helpers, they might benefit from admin accounts or logging. Currently the spec only plans for Matt/Marty/Roianne.

Specific probes:
- "Who handles the cattle when you're away — Perry, anyone else, hired hands, neighbors watching the place?"
- "Do they know which animals need what? Would a simple phone-friendly checklist be useful for them when you're not there?"

**If you can't ask:** default to admin being just Matt/Marty/Roianne. Helper-mode features can be added later.

---

## Section B: What Marty wants to track per animal

These questions shape the data model and the admin fields. The spec locks in a lot of fields; asking Marty which ones he'll actually maintain tells us which fields are real vs. which are aspirational.

### B1. What does Marty currently track on paper or in his head about each animal?

**Who:** Marty
**Why it matters:** The spec includes many fields (birth weight, weaning weight, yearling weight, scrotal circumference, EPDs, BVD-PI status, genetic defect tests, etc.). Some of these Marty may already track; others he may not. Fields he doesn't maintain stay empty and we set expectations accordingly.

Specific probes — go through each and ask "do you record this? would you if the site made it easy?":
- Birth weight
- Weaning weight
- Yearling weight
- Scrotal circumference (bulls)
- Calving ease scores
- Disposition scores
- Vaccinations (which, when)
- BVD-PI test status
- Semen test results (bulls)
- Genetic defect tests
- Sire / dam (pretty sure he knows these)
- Contemporary group

**If you can't ask:** assume basic pedigree + some weights, minimal health tests. Show the fields but don't nudge hard for data he doesn't have.

### B2. Does Marty photograph his animals regularly now? How?

**Who:** Marty
**Why it matters:** The entire media pipeline (Phase 2) assumes iPhone-photo-as-default input. If Marty actually uses a DSLR and imports later, the pipeline design should accommodate that. If he rarely photographs, the "photos cycle on cards" feature has nothing to cycle.

Specific probes:
- "How often do you take photos of your cattle now?"
- "What do you take them with — phone, DSLR, both?"
- "Do you have a folder full of photos somewhere we should pull in?"
- "Would you photograph more if the site made it easy to tag photos to specific animals right from your phone?"

**If you can't ask:** default assumption holds — iPhone photos are the primary input stream; Matt's DSLR shots are secondary.

### B3. Does he actually want to write "About This Animal" narratives?

**Who:** Marty
**Why it matters:** The card back has an "About This Animal" section where Marty writes a paragraph about the animal's personality, history, what he values about her. The whole warmth-of-the-ranch tone depends on this section being populated. If Marty hates writing, this section is going to be empty on every card, which undermines the card design.

Specific probes:
- "Would you write a short paragraph about your favorite cows — who she is, why you like her?"
- "If not writing, would you record a voice note that someone transcribes? Would you talk to a camera while describing her?"
- "Does Roianne write? Would she write these on your behalf?"

**If you can't ask:** assume the narratives will be sparse. The card spec handles this correctly — "About This Animal" section is hidden when empty.

### B4. What's Marty's registration plan with AHA?

**Who:** Marty
**Why it matters:** None of his current animals are registered, but the spec assumes he may register in the future and designs for that. The admin panel is supposed to gently nudge him toward this.

Specific probes:
- "Is registering with AHA something you want to work toward, or is it fine as-is for your operation?"
- "What's stopped you from registering so far — cost, paperwork, doesn't feel needed?"
- "Would you value a site feature that walks you through the paperwork for one animal at a time, if it removed most of the friction?"

**If you can't ask:** assume he's interested in principle but hasn't prioritized it. The spec's gentle-nudge approach is correct.

---

## Section C: How Marty thinks about sales

These affect the Ask-About-This-Animal flow, the inquiries inbox design, the sale-animal UI, and general tonal calibration.

### C1. How do sales actually happen today?

**Who:** Marty
**Why it matters:** The spec treats the site as a serious sales tool with a formal inquiry → response workflow. If Marty's sales happen via neighbor networks and word-of-mouth exclusively, the site may be a secondary/aspirational channel. If he actively markets, the inquiries inbox becomes core.

Specific probes:
- "When you sell an animal, how does that usually come about?"
- "Do you advertise anywhere now — Craigslist, AHA classifieds, local paper, just word-of-mouth?"
- "Have you ever had someone find you through the existing website?"
- "When a buyer calls, how do you handle it — talk on the phone, invite them out to see her, send photos?"

**If you can't ask:** assume the site will be a new channel that may or may not generate traffic; design for both graceful success and graceful emptiness.

### C2. Who handles buyer inquiries?

**Who:** Marty and Roianne (separately, if possible)
**Why it matters:** The inquiries inbox (A24/A25) is designed for Roianne as primary responder with SMS notifications to Marty. Need to confirm this is right.

Specific probes:
- "If someone emails or texts about a cow, who responds — you (Marty), Roianne, both?"
- "Is there a 'we need to talk first' thing, or does whoever sees it first respond?"
- "Would you (Marty) want to be pinged every time an inquiry comes in, or only when Roianne flags one for you?"

**If you can't ask:** default to Roianne-primary with SMS to both. They can adjust in settings.

### C3. What sale-related information does Marty want private vs. public?

**Who:** Marty
**Why it matters:** The spec hides sale price and buyer info from the public by default. Some rancher sites do publish sold-for prices (builds reputation for good pricing); others never do. Marty's preference shapes what we can publicly signal.

Specific probes:
- "Are you comfortable showing publicly which animals are for sale right now? (Current spec: yes)"
- "When an animal is sold, should the public site mention it was sold, hide the animal, or archive with a 'sold' badge?"
- "Should sale prices ever be public? Historically? Or always private?"

**If you can't ask:** assume all sales details stay private (current spec default).

---

## Section D: The aspirational / nudge aspect

One of the core premises of the site is that it gently nudges Marty toward professional seedstock practices (registration, performance recording, etc.). This only works if he actually wants to be nudged.

### D1. Does Marty want to be nudged?

**Who:** Marty directly
**Why it matters:** If he'd find nudges annoying, we should dial them way back. If he'd appreciate reminders ("here's what you haven't logged yet"), we keep the current design.

Specific probes:
- "The site is designed to gently remind you about things you might want to do — record a weight, register a cow, take a new photo of a for-sale animal. Does that sound helpful or annoying?"
- "If the site said 'Sweetheart's photo is 9 months old, she's listed for sale' — would you update the photo, or would you feel nagged?"
- "Would you want to be able to turn nudges off? Quiet them for a while?"

**If you can't ask:** current design is correct (nudges present but dismissable; not modal).

### D2. What's Marty's long-term vision for the operation?

**Who:** Marty (this is a conversation, not a form-fill)
**Why it matters:** Matt mentioned Marty may turn to ranching full-time after retirement. If that's true and years away, the site can be designed for current-scale with growth room. If it's imminent or Marty is scaling now, we might prioritize features differently.

Specific probes:
- "Where do you see the ranch in five years — same size, growing, different mix?"
- "If you had time, would you do more — more animals, more registration, more shows?"
- "Would the ranch become Perry's someday, or someone else's? Is the site building something that outlasts this generation?"

**If you can't ask:** design for the current scale with modular additions; don't over-engineer for hypothetical growth.

---

## Section E: Roianne-specific questions

Most of the conversation has been about Marty, but Roianne is a genuine co-operator and an active admin user. A few things to learn from her specifically.

### E1. What does Roianne want to see or use?

**Who:** Roianne
**Why it matters:** The spec treats her mostly as the inquiries-responder. She may have other use cases — writing About sections, reviewing photos, managing the gallery, planning content. Better to ask than assume.

Specific probes:
- "Would you enjoy curating the photo gallery — picking which shots show up on the Wall?"
- "Would you write 'About This Animal' descriptions if Marty doesn't?"
- "Do you want to see activity on the site — a weekly digest of what's happening?"

**If you can't ask:** default model (she's inquiries-primary) holds.

### E2. What should the About page say?

**Who:** Roianne and Marty together, ideally
**Why it matters:** The About page is currently placeholder copy. It's the warmth anchor for the site; getting the tone right matters. This is partly a content question, partly a "who writes it" question.

Specific probes:
- "Who should write the About page story — you, me (Matt), together?"
- "What do you want visitors to know about the ranch besides the basic facts?"
- "Are there stories about the ranch's history you want to tell?"
- "What would a nearby rancher who's been watching you for years say about Summers Ranch?"

**If you can't ask:** Matt drafts placeholder; Roianne/Marty revise before launch. This is already the plan in the main spec.

---

## Section F: Quality-of-life / small things

A handful of smaller assumptions worth confirming.

### F1. Does Marty use Face ID?

**Who:** Marty
**Why it matters:** The auth design (passkeys with Face ID) depends on his phone having Face ID enabled and his being comfortable with it. If he never set it up or actively disabled it, the auth UX plan changes.
**If you can't ask:** safe assumption given he has an iPhone 12, but confirming removes one surprise.

### F2. Does Marty know what a "passkey" is?

**Who:** Marty
**Why it matters:** Not critical — the first-time setup walks him through it — but knowing his baseline comfort helps calibrate how much hand-holding the setup UI needs.
**If you can't ask:** assume no technical familiarity; design explanations for a first-time user.

### F3. Does Marty want the site bookmarked on his home screen?

**Who:** Marty
**Why it matters:** If the site gets "home screen" treatment, we might add a PWA manifest so it gets an app-like icon and can open without Safari chrome. That's a small additional scope item worth flagging if valued.
**If you can't ask:** assume yes; add basic PWA manifest during Phase 1 regardless (low cost).

### F4. Would Marty use the site at night with dim lighting?

**Who:** Marty
**Why it matters:** Dark mode is a real question for ranch-use. If he's checking the site in bed or after sundown outside, dark mode would be useful. If he's always at a desk or in daylight, dark mode is extra work for little gain.
**If you can't ask:** default to no dark mode in Phase 1; add in Phase 2 if desired.

### F5. What does Marty call his animals — by tag number, by name, by something else?

**Who:** Marty (and Roianne — they may differ)
**Why it matters:** The spec uses "tag + name" conventionally, with name shown prominently. If Marty actually refers to animals by tag number and names are rarely used, the card front might de-emphasize name. Conversely if every animal has a name, we should nudge admin to always have one.
**If you can't ask:** current design (name prominent, tag secondary) works either way.

---

## Section G: Things to genuinely watch for

These aren't questions — they're observations to make while you're together.

- **Does Marty's iPhone home screen have many apps, or is it minimal?** Tells you about his comfort with technology.
- **Does he actually use any apps while you're there?** Texts, calls, weather, anything? That's his baseline digital vocabulary.
- **When you show him something on the phone, does he want to hold the phone himself, or does he lean in to see your screen?** Predicts whether he'll engage solo or want guided walkthroughs.
- **Does Roianne demonstrate any specific app workflows?** She's going to be the primary admin user; her current digital habits predict what will feel natural in the admin UI.

These observations are probably more predictive than any direct question. Marty may say "yes I'll use it every day" out of enthusiasm, but if his phone shows he uses three apps total, the site needs to be that-many-apps simple.

---

## What we do with the answers

After your visit, bring the answers back. We'll:

1. Update the amendments file with a new section "Known user behavior" capturing what you learned
2. Revise specific spec sections where assumptions were wrong
3. Identify any features that should be dropped (because nobody will use them) or added (because there's a real need we missed)
4. Tune the nudge language, default settings, and field prominence accordingly

Nothing we've locked is urgent to revisit before you ask these. The coding agent's first two checkpoints (foundation + public static pages) don't depend on any of this. By the time we're at admin-surface-contents (Checkpoint 3-4), we'll have your ranch-visit notes integrated.

Safe trip up.
