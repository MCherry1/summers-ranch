# Acquisition & Sale Tracking — Spec

*Addendum to CATTLE-CARDS-SPEC.md. For Claude Code implementation.*

---

## Overview

Track how animals enter and leave the herd with enough detail for Marty's records, while giving him control over what's shown publicly.

---

## 1. Acquisition Details (When Source ≠ "herd")

These fields appear ONLY when the `source` dropdown is set to `"purchased"` or `"reference"`. When source is `"herd"` (born here), this entire section is hidden and the `date_entered` auto-syncs with `born`.

### Fields

| Field | Type | Display | Description |
|-------|------|---------|-------------|
| `date_entered` | date picker | Admin only | When the animal joined the herd. Auto-synced with `born` when source is "herd". Editable when purchased/reference. |
| `acquisition_method` | dropdown | Public (if checkbox on) | How the animal was acquired. |
| `source_ranch` | text | Public (if checkbox on) | Name of the ranch/operation it came from. |
| `show_source_publicly` | checkbox | Admin only | Whether to display source ranch and acquisition method on the public cattle card. **Unchecked by default.** |

### Acquisition Method Dropdown Options

```
Private Treaty      (direct sale between ranches — most common for breeding stock)
Auction             (public sale barn / livestock auction)
Consignment Sale    (breed association or multi-ranch sale event)
Production Sale     (at the seller's ranch)
Online Sale         (internet or video auction)
Other
```

### Admin Panel Layout (when source = "purchased")

```
┌──────────────────────────────────────────────────┐
│  Source                                          │
│  [ Purchased ▾ ]                                 │
│                                                  │
│  Acquired From                                   │
│  [ Red River Ranch          ]                    │
│                                                  │
│  Acquisition Method                              │
│  [ Private Treaty ▾ ]                            │
│                                                  │
│  Date Acquired                                   │
│  [ 2025-06-15 ]  (date picker)                   │
│                                                  │
│  ☐ Show source info on public cattle page        │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Public Cattle Card Display (when checkbox is checked)

On the expanded card view, below the lineage info:

```
Acquired from Red River Ranch (private treaty)
```

Small, muted text. Not prominent — just a detail for interested buyers. When the checkbox is unchecked, nothing shows publicly. The animal just appears as part of the herd with no acquisition history visible.

### Tooltip for "Show source info"

> Check this to display where this animal came from on the public website. Some buyers appreciate knowing the source ranch — it adds credibility. Leave unchecked if you prefer to keep acquisition details private.

---

## 2. Sale Details (When Status = "sold")

These fields appear ONLY when the `status` dropdown is set to `"sold"`. They are ALWAYS private — never shown on the public cattle page. The public page only shows the "Sold" ribbon on the card.

### Fields

| Field | Type | Display | Description |
|-------|------|---------|-------------|
| `sold_to` | text | **Always private** | Name of the buyer / ranch. |
| `sale_method` | dropdown | **Always private** | How the animal was sold. |
| `sale_date` | date picker | **Always private** | When the sale occurred. |
| `sale_notes` | text | **Always private** | Any notes about the sale (price negotiated, terms, delivery details). |

### Sale Method Dropdown Options

```
Private Treaty      (direct sale, buyer visits the ranch)
Auction             (public livestock auction)
Consignment Sale    (breed association sale)
Production Sale     (on-ranch sale event)
Online Sale         (internet / video auction)
Other
```

### Admin Panel Layout (when status = "sold")

These fields slide in below the status dropdown when "Sold" is selected:

```
┌──────────────────────────────────────────────────┐
│  Status                                          │
│  [ Sold ▾ ]                                      │
│                                                  │
│  ── Sale Details (private — not shown publicly) ─│
│                                                  │
│  Sold To                                         │
│  [ Johnson Ranch             ]                   │
│                                                  │
│  Method of Sale                                  │
│  [ Auction ▾ ]                                   │
│                                                  │
│  Sale Date                                       │
│  [ 2026-04-10 ]  (date picker)                   │
│                                                  │
│  Notes                                           │
│  [ Sold at Escalon livestock, good price.      ] │
│                                                  │
│  🔒 This information is never shown publicly.    │
│                                                  │
│  [ Remove from Herd ]                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

The "🔒 This information is never shown publicly" note is important — Marty needs to feel comfortable entering buyer names and sale details without worrying they'll appear on the website.

### Similarly for Culled/Deceased

When status is "culled" or "deceased", show:

| Field | Type | Display |
|-------|------|---------|
| `removal_date` | date picker | **Always private** |
| `removal_reason` | text | **Always private** |

Simple — just the date and a notes field. No dropdown needed; the reasons are too varied (sold for beef, injury, illness, old age, etc.).

---

## 3. Updated Schema

Add these fields to the animal record in `cattle-data.json`:

```json
{
  "tag": "315",
  
  "source": "purchased",
  "source_ranch": "Red River Ranch",
  "acquisition_method": "private_treaty",
  "date_entered": "2025-06-15",
  "show_source_publicly": false,
  
  "status": "sold",
  "sold_to": "Johnson Ranch",
  "sale_method": "auction",
  "sale_date": "2026-04-10",
  "sale_notes": "Sold at Escalon livestock, good price.",
  
  "removal_date": "",
  "removal_reason": "",
  
  ...
}
```

### New Fields Summary

| Field | Type | Default | Private? |
|-------|------|---------|----------|
| `acquisition_method` | string | `""` | Controlled by checkbox |
| `show_source_publicly` | boolean | `false` | N/A (controls other fields' visibility) |
| `sold_to` | string | `""` | Always private |
| `sale_method` | string | `""` | Always private |
| `sale_date` | string | `""` | Always private |
| `sale_notes` | string | `""` | Always private |
| `removal_date` | string | `""` | Always private |
| `removal_reason` | string | `""` | Always private |

---

## 4. Conditional Field Visibility

The admin panel should show/hide field groups based on the current values:

| When... | Show these fields |
|---------|-------------------|
| `source` = "herd" | Hide acquisition section. `date_entered` syncs with `born`, grayed out. |
| `source` = "purchased" or "reference" | Show acquisition section (method, source ranch, date, checkbox). |
| `status` = "sold" | Show sale details section (sold to, method, date, notes). Show "Remove from Herd" button. |
| `status` = "culled" or "deceased" | Show removal section (date, reason). Show "Remove from Herd" button. |
| `status` = anything else | Hide sale/removal sections. |

Fields slide in/out with a smooth CSS transition when the dropdowns change. Not jarring — just a gentle expand/collapse.

---

## 5. Tooltips for New Fields

**Acquisition Method:**
> How you acquired this animal. "Private treaty" means a direct sale between ranches — the most common way to buy breeding stock. "Consignment sale" is a breed association or multi-ranch sale event where multiple sellers bring animals.

**Source Ranch:**
> The ranch or operation this animal came from. Useful for tracking genetics and for buyers who want to know the animal's background.

**Show Source Publicly:**
> Check this to display where this animal came from on the public website. Some buyers appreciate knowing the source ranch — it adds credibility. Leave unchecked if you prefer to keep acquisition details private.

**Sold To:**
> Who bought this animal. This is never shown on the public website — it's just for your records.

**Method of Sale:**
> How you sold this animal. Tracking this helps you understand which sales channels work best for your operation.
