# Photo Pipeline Architecture

## Core principle

For Summers Ranch, the photo pipeline is not a side feature. It is a core subsystem.

The main operator is expected to:
- use an iPhone
- use the Share Sheet comfortably
- avoid technical workflows
- upload many cattle photos over time

So the architecture must optimize for:
- minimal taps
- reliable intake
- aggressive automation
- safe correction tools

## Existing prototype model

The current model is conceptually good:

- uploads land in an inbox
- processing runs automatically
- photos are classified, renamed, and routed
- public presentation is derived from processed results

That should remain the general pattern.

## Long-term recommendation

Keep the **inbox model**, but do not assume the **git repo** should remain the permanent intake queue.

Desired long-term flow:

1. upload arrives
2. intake record is created
3. processing classifies and creates derivatives
4. cattle/gallery associations are updated
5. public/admin eligibility is derived
6. site reads the structured result

## Required cattle-photo behavior

### Canonical public card views
Each public herd card should aim to show the most recent acceptable:
- side view
- head-on view
- three-quarter view

### Soft cycling
The card cycles gently through those three views.

### Timeline history
Clicking into an animal should show the full photo history in chronological order, enabling a growth timeline.

## Required gallery behavior

Gallery/hero uploads can follow a parallel intake track.

These should support:
- seasonal hero rotation
- general ranch gallery
- manually curated featured images
- DSLR/drone uploads without requiring the same tag-centric logic as cattle photos

## Metadata handling

Public files should have privacy-sensitive metadata stripped.

Useful metadata can be preserved in a structured private record linked to the media asset, such as:
- capture date
- device type
- location data if retained privately
- processing history
- AI classification details

## Admin controls required later

A logged-in admin should eventually be able to:
- hide a photo
- delete a photo
- reorder a photo
- reassign a photo to another animal
- override shot type
- choose primary/canonical images
- restore hidden items
- review low-confidence items

## Recommendation

Treat the photo pipeline as a first-class subsystem in the rebuild.

The public site quality depends heavily on it.
