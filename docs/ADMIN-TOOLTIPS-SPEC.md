# Admin Panel — Help Tooltips Spec

*For Claude Code implementation. Read this entire document before writing any code.*

---

## Overview

Add small ⓘ help buttons next to field labels throughout the admin panel. Tapping one opens a tooltip bubble with a brief, friendly explanation of what the field is for, why it matters, and what buyers or breed associations expect.

The tone is: a knowledgeable friend explaining things over the fence. Not a textbook. Not condescending. Assume Marty knows his cattle but might not know industry terminology or what buyers look at on a website.

---

## Tooltip Design

### The ⓘ Button
- Small circle with "i" or "?" inside, 20px diameter
- Color: `var(--stone)` at 50% opacity (subtle, not distracting)
- Sits immediately after the field label, inline
- Touch target: 44x44px (the visible circle is 20px but the tappable area is larger)
- Cursor: pointer on desktop

### The Tooltip Bubble
- Appears below or above the ⓘ button (whichever has more room on screen)
- Max width: 280px (fits comfortably on iPhone)
- Background: `var(--earth)` with white text
- Small arrow/caret pointing to the ⓘ button
- Rounded corners (4px)
- Font size: 0.8rem, line-height: 1.5
- Padding: 0.75rem 1rem
- Tap the ⓘ again or tap anywhere else to dismiss
- Only one tooltip visible at a time (opening a new one closes the previous)

### Implementation
```html
<label>Calving Ease <button class="help-tip" data-tip="calving-ease">ⓘ</button></label>
```

```css
.help-tip {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%;
    font-size: 0.65rem; font-weight: 700;
    color: var(--stone); background: rgba(122,117,111,0.15);
    border: none; cursor: pointer; margin-left: 4px;
    vertical-align: middle; padding: 0;
    /* Expand touch target */
    position: relative;
}
.help-tip::before {
    content: ''; position: absolute;
    top: -12px; right: -12px; bottom: -12px; left: -12px;
}
```

Use a single tooltip container that repositions itself when triggered. Don't create 20 separate tooltip elements.

---

## Tooltip Text — Per Field

### Animal Identity

**Tag Number**
> This is the ear tag number — the animal's primary ID. Buyers and breed associations reference animals by tag number. Use the same number that's on the physical ear tag.

**Name**
> Optional but buyers remember names. A named animal feels like an individual, not just a number. Many ranchers name their best breeding stock.

**Registration (Reg #)**
> If this animal is registered with the American Hereford Association (AHA), enter the registration number here. Buyers can look up the full pedigree, EPDs, and genetic data on hereford.org using this number. This is the single most valuable field for selling registered stock.

### Lineage

**Sire**
> The father. Select from your herd or from outside/reference animals. Tracking sires lets buyers evaluate the genetics behind each animal. If the sire is from another ranch, add it as a reference animal first.

**Dam**
> The mother. Same as sire — select from your herd or reference animals. Dam quality is often more important than sire quality for evaluating replacement heifers.

### Physical Data

**Born**
> The birth date, or your best estimate. The American Hereford Association requires an exact date for registration. If you find a 2-day-old calf, just scroll back a couple days — an estimate is fine. This date is used to calculate the animal's age on the website and to detect calving season automatically.

**Sex**
> Bull, cow, heifer (young female that hasn't calved), steer (castrated male), or calf (young, sex not yet relevant). This affects which fields show up and how the animal is categorized on the site.

**Breed**
> Primary breed. For your registered Herefords, this is "Hereford." For crossbred calves (like when a neighbor's bull gets in), use the primary breed and add details in Breed Detail.

**Breed Detail**
> For crossbred or percentage animals. Examples: "Hereford x Angus cross", "3/4 Hereford 1/4 Angus". Leave blank for purebreds. Being upfront about crossbreeding builds trust with buyers.

### Performance Data

**Birth Weight**
> Weight at birth in pounds. Tells buyers about calving ease — lighter birth weights usually mean easier deliveries. The AHA average for Herefords is around 75-85 lbs. Record this within 24 hours of birth if possible.

**Weaning Weight**
> Weight at weaning (typically around 205 days / 7 months old). This is the primary growth indicator buyers look at. Heavier weaning weights mean better-growing calves. The industry standard is the "adjusted 205-day weight" but your actual weaning weight is fine.

**Yearling Weight**
> Weight at approximately 365 days old. Shows the animal's growth trajectory from weaning to maturity. Optional — not all operations weigh yearlings, but it's valuable data if you have it.

**Calving Ease**
> Industry standard 1–5 scale for how the birth went. This is one of the FIRST things a buyer asks about when evaluating a bull — "Will my heifers have trouble with his calves?" For dams, record their most recent calving. For bulls, this reflects their calves' average.
>
> 1 = No assistance needed
> 2 = Easy pull (one person)
> 3 = Hard pull (mechanical assistance)
> 4 = Surgical (C-section)
> 5 = Abnormal presentation

**Disposition**
> Temperament score using the BIF (Beef Improvement Federation) 1–6 scale. Buyers care about this more than ever — docile cattle are safer to handle, gain weight better, and produce calmer offspring. Evaluate in both the pasture and the pen, since some cattle act differently when corralled.
>
> 1 = Docile (gentle, easy to handle)
> 2 = Restless (slightly agitated but manageable)
> 3 = Nervous (moves away quickly, hard to settle)
> 4 = Flighty (runs when approached, jumpy)
> 5 = Aggressive (turns to face you, may charge)
> 6 = Very Aggressive (dangerous, attacks unprovoked)

### Breeding Status

**Pregnancy Status**
> For females you're thinking of selling. Buyers pay significantly more for a bred or confirmed-pregnant female than an open one. "Open" = not pregnant. "Bred" = exposed to a bull or AI'd. "Confirmed" = pregnancy verified by a vet (usually via palpation or ultrasound).

**Expected Calving**
> When the calf is due. Cattle gestation is approximately 283 days. If you know when she was bred, count forward 283 days. Even a rough estimate like "March 2026" is useful for buyers.

**Calves (offspring count)**
> How many calves this animal has produced. For dams, it's the number she's birthed. For bulls, it's the number he's sired. This number updates automatically when you add a new animal and select this one as its sire or dam. A cow with 6 healthy calves is a proven producer — that's valuable information for a buyer.

### Status & Management

**Status**
> Where this animal stands in your operation:
> - **Breeding Stock** — Active in your breeding program
> - **For Sale** — Available for purchase (shows an "Inquire" button on the website)
> - **Sold** — Purchased by someone else (stays visible on the site with a "Sold" ribbon)
> - **Retired** — No longer breeding but still on the ranch
> - **Culled / Deceased** — Removed from the herd (hidden from the public site but kept in your records)

**Notes**
> Anything else worth knowing about this animal. Buyers see this on the website, so keep it positive and professional. Good examples: "Excellent milker, easy keeper", "Throws calves with great depth and width", "Gentle with handlers." Save medical details for your paper records.

### Photos

**Photo guidance (show at top of photos section, not as a tooltip)**
> The three most valuable photos for selling cattle:
>
> **Side profile** — Full body from the side, all four feet visible. This is the #1 photo buyers want — it shows the animal's build, depth, and structure. Stand at shoulder level, not above.
>
> **Headshot** — Face and head filling the frame. Shows breed character and expression.
>
> **Three-quarter angle** — Between side and front, showing depth and width.
>
> Take photos in the morning or late afternoon for the best light. Overcast days work great — no harsh shadows. A whistle or feed bucket gets ears forward.

---

## Where NOT to Put Tooltips

- The tag number input on the "Add Animal" form (too basic to need explanation at that moment)
- Button labels (self-explanatory actions)
- The sort controls
- The photo upload area (the photo guidance blurb covers this)

---

## Mobile Considerations

- Tooltips should never extend beyond the screen edges. On narrow screens, the tooltip should be full-width with small side margins.
- The ⓘ button must not interfere with the label text — keep it on the same line but with enough spacing.
- Dismissing a tooltip by tapping elsewhere should NOT accidentally trigger the field below it. Use `stopPropagation` on the tooltip container.
- Tooltips should be closeable by tapping the ⓘ button again (toggle behavior).
