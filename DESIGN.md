# DESIGN.md

## 1. Visual theme and atmosphere
SignSense opens like a short film, then lets the visitor read at their own pace. A family image stays beside a scrolling first-person story; the child has agency, and the product supports the hearing learner without speaking for Deaf people.
Dials — landing: DESIGN_VARIANCE 7, MOTION_INTENSITY 6, VISUAL_DENSITY 3. Practice app: DESIGN_VARIANCE 4, MOTION_INTENSITY 2, VISUAL_DENSITY 5.
The memorable thing is a sticky side photograph that fades in beside three story beats as the page scrolls naturally.

## 2. Color palette and roles
| Role | Name | Hex | Use |
|---|---|---|---|
| base | Deep evergreen | #0B1718 | Hero, practice workspace |
| surface | Pine ink | #101820 | Practice panels |
| surface raised | Slate | #17232D | Controls and inset areas |
| paper | Mist | #F4F6F2 | Story sections |
| text | Frost | #E8EEF5 | Practice text |
| story text | Evergreen ink | #12201F | Light section copy |
| muted | Steel | #93A4B4 | App secondary text |
| accent | Signal teal | #5FD4E0 | Actions and focus; darker text-safe tone #075D62 on light surfaces |
| success / warning / error | Leaf / amber / rose | #8FE388 / #F0B95A / #FF7A8A | Explicit status cues in practice |
Use the same teal signal throughout; select its text-safe contrast variant by surface. Status always has text, not color alone.

## 3. Typography
| Role | Family | Weight | Size / line-height | Notes |
|---|---|---|---|---|
| display | Newsreader | 400–600 | 40–88 / 1.0–1.08 | Human, narrative headlines |
| heading and body | Inter Tight | 400–700 | 13–20 / 1.45–1.65 | UI, navigation, readable explanation |
| label / data | UI monospace | 500–700 | 10–13 / 1.3 | Short status and tabular counts |
The existing locally hosted Newsreader and Inter Tight faces are already part of the product and keep story and controls distinct.

## 4. Components
Buttons use a single teal primary action, 44px minimum touch height, visible focus, and direct outcome labels. Secondary actions are text links or outlined controls. Panels group actual practice tasks; they do not decorate marketing content. Tabs retain their URL-backed mode state. Dialogs and camera errors must keep a clear recovery action.

## 5. Layout
Landing plan: (0) short, skippable brand intro that reveals the story immediately; (1) split-screen story with one sticky family photo and three right-side narrative beats; (2) actual coach demo; (3) plain-language practice loop, limits, and one final CTA. First viewport wireframe: small translucent brand/nav; left half family image fading into view; right half “Imagine you’re ten…” with short supporting line and one CTA. The story continues below without pinned or hijacked scrolling.
Practice plan: top row for brand/mode/progress; large camera stage plus one coaching message; right rail for target shape and one next action; visible camera/demo controls; advanced AI and diagnostics stay in labeled disclosure sections.
Use a 4/8/12/16/24/32/48/64 spacing scale, a 1440px landing max width, edge-to-edge story photos, hairline dividers, square editorial CTAs, and restrained 12px practice-panel radius.

## 6. Depth and elevation
Story uses a sticky image as a material surface beside the narrative, with a translucent header that keeps the page context visible. Story beats reveal with opacity and small transform changes, never scroll-linked layout movement. Practice uses borders and surface steps; reserve blur for functional overlays over video. Reduced motion bypasses the intro and replaces movement with a brief opacity change; reduced transparency removes blur.

## 7. Direction references, do, and do not
Awesome Design MD references are principle sources only. Do not copy their palette, fonts, layout, logo, or copy.

**Apple**
- Type: compact confident display hierarchy; we keep our own local typefaces.
- Color: photography carries atmosphere while one action color signals interaction.
- Density: one dominant image and one message at a time.
- Motion: interface chrome recedes; no ornamental animation is needed.
- Voice: assured and spare; reject Apple’s product-catalog tone for our family story.

**Nike**
- Type: campaign scale can give a short emotional line weight.
- Color: keep interface chrome quiet and leave expression to imagery.
- Density: treat each full-width section as a distinct editorial beat.
- Motion: movement should serve the image/campaign, not add constant effects.
- Voice: direct and active; reject shouty uppercase and sports campaign bravado.

**WIRED**
- Type: let narrative display typography differ from structural UI labels.
- Color: use disciplined neutrals and reserve the accent for links and actions.
- Density: borrow clear feature-story rhythm, not a crowded magazine index.
- Motion: flat surfaces and hairlines keep attention on content.
- Voice: specific and editorial; reject technology-magazine jargon.

Synthesis: a family photograph and first-person story lead; wide spacing and reduced chrome come from Apple; campaign storytelling comes from Nike; the story-to-product transition and type roles come from WIRED. Apple’s interaction guidance also informs the skippable intro, interruptible controls, translucent navigation, and reduced-motion/transparency variants. Project palette, words, local fonts, and camera-stage layout remain SignSense-specific.

Do: keep the learner’s current letter, camera/demo switch, and one actionable cue easy to spot; say when camera images go to optional AI; describe this as fingerspelling practice between lessons. Do not call Deaf people mute, imply the tool teaches all of ASL, use pity framing, or let a cue repeat once its constraint is comfortably correct.

## 8. Responsive behavior
Breakpoints: 920px for practice rail stacking/tablet navigation, 600px for story columns and mobile controls. Buttons and tabs stay at least 44px high; use safe-area insets; never clip copy or let overlays cover focus. Hero text stacks over the photograph on narrow screens with a bottom-up contrast mask. Honor reduced motion.

## 9. Agent prompt guide
Use the existing React, Tailwind v4, CSS tokens, Button, and Lucide icon family. Use 21st.dev’s Editorial Image Hero metadata as composition inspiration, adapted to a full-bleed story image rather than copied. For every change check hierarchy, touch size, focus, 390/768/1280/1440 widths, and reduced motion. No new UI dependencies for basic controls. Reject repeated card grids, decorative gradients, fake proof, and vague CTA text.
