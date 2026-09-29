# Design System

## 1. Visual Theme & Atmosphere

The interface uses a dark, immersive visual language where the UI recedes into near-black surfaces and the brand color becomes the primary source of functional emphasis. Content, data, imagery, and meaningful interactions should remain the visual focus.

The design philosophy is **"content-first darkness"** — the UI provides a deep neutral canvas while the primary brand color is reserved for actions, active states, progress, and important interaction points.

### Key Characteristics

* Near-black immersive dark theme (`#121212`–`#1f1f1f`)
* Primary brand yellow (`#F3E700`) as the singular brand color
* Primary focus yellow (`#FFF200`) for hover, focus, and pressed states
* Achromatic UI surfaces built from dark charcoal tones
* Rounded pill buttons (`500px`–`9999px`)
* Circular controls using `50%` radius
* Uppercase button labels with wide letter-spacing
* Heavy shadows on elevated elements
* Dedicated semantic colors for errors, warnings, and information
* Brand color is functional rather than decorative
* Content remains the primary visual focus

---

## 2. Color Palette & Roles

### 2.1 Brand

| Token                   | Value     | Role                                                 |
| ----------------------- | --------- | ---------------------------------------------------- |
| `--color-primary`       | `#F3E700` | Primary actions, active states, selected states      |
| `--color-primary-focus` | `#FFF200` | Hover, focus, pressed, and emphasized primary states |

The brand colors must remain reserved for product interactions and meaningful visual emphasis.

### 2.2 Backgrounds & Surfaces

| Token                          | Value     | Role                                  |
| ------------------------------ | --------- | ------------------------------------- |
| `--color-background`           | `#121212` | Application/page background           |
| `--color-surface`              | `#181818` | Standard cards, panels, containers    |
| `--color-surface-interactive`  | `#1f1f1f` | Buttons, inputs, interactive surfaces |
| `--color-surface-elevated`     | `#252525` | Elevated cards and panels             |
| `--color-surface-elevated-alt` | `#272727` | Alternate elevated surface            |
| `--color-surface-light`        | `#eeeeee` | Rare light-mode surfaces              |

### 2.3 Text

| Token                    | Value     | Role                                      |
| ------------------------ | --------- | ----------------------------------------- |
| `--color-text-primary`   | `#ffffff` | Primary content and headings              |
| `--color-text-secondary` | `#b3b3b3` | Secondary content and inactive navigation |
| `--color-text-muted`     | `#7c7c7c` | Supporting metadata, disabled content     |
| `--color-text-inverse`   | `#000000` | Text/icons on primary yellow              |

Do not use the primary brand color as ordinary body text.

### 2.4 Borders & Dividers

| Token                   | Value     | Role                            |
| ----------------------- | --------- | ------------------------------- |
| `--color-border`        | `#4d4d4d` | Standard component borders      |
| `--color-border-strong` | `#7c7c7c` | Strong/outlined control borders |
| `--color-divider`       | `#3a3a3a` | Section separators and dividers |

`#b3b3b3` is reserved for secondary text and must not be used as a generic divider.

### 2.5 Semantic Colors

| Token             | Value     | Role                          |
| ----------------- | --------- | ----------------------------- |
| `--color-error`   | `#f3727f` | Errors and destructive states |
| `--color-warning` | `#ffa42b` | Warnings and caution          |
| `--color-info`    | `#539df5` | Informational states          |

Semantic colors are independent from the brand color.

### 2.6 Canonical CSS Variables

```css
:root {
  /* Brand */
  --color-primary: #F3E700;
  --color-primary-focus: #FFF200;

  /* Backgrounds & Surfaces */
  --color-background: #121212;
  --color-surface: #181818;
  --color-surface-interactive: #1f1f1f;
  --color-surface-elevated: #252525;
  --color-surface-elevated-alt: #272727;
  --color-surface-light: #eeeeee;

  /* Text */
  --color-text-primary: #ffffff;
  --color-text-secondary: #b3b3b3;
  --color-text-muted: #7c7c7c;
  --color-text-inverse: #000000;

  /* Borders & Dividers */
  --color-border: #4d4d4d;
  --color-border-strong: #7c7c7c;
  --color-divider: #3a3a3a;

  /* Semantic */
  --color-error: #f3727f;
  --color-warning: #ffa42b;
  --color-info: #539df5;

  /* Typography */
  --font-family-sans:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}
```

These variables are the **single source of truth** for color usage throughout the application.

---

## 3. Typography Rules

### Font Families

Use a modern system sans-serif stack unless the product defines a dedicated brand font.

```css
--font-family-sans:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

### Hierarchy

| Role             |   Size |  Weight | Line Height | Letter Spacing |
| ---------------- | -----: | ------: | ----------: | -------------: |
| Section Title    |   24px |     700 |      normal |         normal |
| Feature Heading  |   18px |     600 |        1.30 |         normal |
| Body Bold        |   16px |     700 |      normal |         normal |
| Body             |   16px |     400 |      normal |         normal |
| Button Uppercase |   14px | 600–700 |        1.00 |      1.4px–2px |
| Button           |   14px |     700 |      normal |         0.14px |
| Nav Link Bold    |   14px |     700 |      normal |         normal |
| Nav Link         |   14px |     400 |      normal |         normal |
| Caption Bold     |   14px |     700 |        1.50 |         normal |
| Caption          |   14px |     400 |      normal |         normal |
| Small Bold       |   12px |     700 |        1.50 |         normal |
| Small            |   12px |     400 |      normal |         normal |
| Badge            | 10.5px |     600 |        1.33 |         normal |
| Micro            |   10px |     400 |      normal |         normal |

### Principles

* **Bold/regular binary:** Use 700 for emphasis and 400 for standard content.
* **600 sparingly:** Use semibold for secondary hierarchy.
* **Uppercase buttons:** Primary action labels may use uppercase with `1.4px–2px` tracking.
* **Compact sizing:** Keep UI typography generally within `10px–24px`.
* **Clear hierarchy:** Use typography weight before excessive size variation.

---

## 4. Component Styling

### 4.1 Primary Pill

```text
Background: var(--color-primary)
Text: var(--color-text-inverse)
Padding: 8px 16px
Radius: 9999px
```

Use for:

* Primary CTAs
* Submit actions
* Important actions
* Conversion actions

### Primary Pill — Hover / Focus

```text
Background: var(--color-primary-focus)
Text: var(--color-text-inverse)
Radius: 9999px
```

### 4.2 Dark Pill

```text
Background: var(--color-surface-interactive)
Text: var(--color-text-primary)
Padding: 8px 16px
Radius: 9999px
```

Use for secondary actions and navigation.

### 4.3 Outlined Pill

```text
Background: transparent
Text: var(--color-text-primary)
Border: 1px solid var(--color-border-strong)
Padding: 4px 16px
Radius: 9999px
```

Use for:

* Secondary actions
* Filters
* Optional interactions
* Follow actions

### 4.4 Primary Outlined Pill

```text
Background: transparent
Text: var(--color-primary)
Border: 1px solid var(--color-primary)
Radius: 9999px
```

Use sparingly for brand-emphasized secondary actions.

### 4.5 Circular Primary Action

```text
Background: var(--color-primary)
Text/Icon: var(--color-text-inverse)
Padding: 12px
Radius: 50%
```

Use for:

* Add
* Create
* Play
* Important contextual actions

Hover:

```text
Background: var(--color-primary-focus)
```

### 4.6 Cards & Containers

```text
Background: var(--color-surface)
Radius: 6px–8px
Border: none
```

Interactive cards may use:

```text
Background: var(--color-surface-interactive)
```

Elevated cards:

```text
Box Shadow: rgba(0,0,0,0.3) 0px 8px 8px
```

Brand-highlighted cards may use:

```text
Border: 1px solid var(--color-primary)
```

Avoid excessive brand-colored borders.

---

## 5. Inputs

### Default Input

```text
Background: var(--color-surface-interactive)
Text: var(--color-text-primary)
Border: transparent
Radius: 8px
Padding: 12px 16px
```

### Search Input

```text
Background: var(--color-surface-interactive)
Text: var(--color-text-primary)
Radius: 500px
Padding: 12px 48px
```

### Focus

```text
Border: 1px solid var(--color-primary-focus)
Outline: none
```

Optional focus ring:

```css
box-shadow: 0 0 0 2px rgba(255, 242, 0, 0.18);
```

---

## 6. Navigation

### Desktop Sidebar

```text
Background: var(--color-background)
```

Active navigation:

```text
Color: var(--color-primary)
Font Weight: 700
```

Inactive navigation:

```text
Color: var(--color-text-secondary)
Font Weight: 400
```

Hover:

```text
Color: var(--color-text-primary)
```

Primary navigation icons may use the primary color only when representing the active state.

### Mobile Navigation

Desktop sidebar transitions into a bottom navigation bar on smaller screens.

Active:

```text
Color: var(--color-primary)
```

Inactive:

```text
Color: var(--color-text-secondary)
```

---

## 7. Layout Principles

### Spacing System

Base unit:

```text
8px
```

Recommended scale:

```text
1px
2px
3px
4px
6px
8px
10px
12px
14px
16px
20px
24px
32px
40px
48px
64px
```

Prefer multiples of 4px or 8px for major layout spacing.

### Grid & Container

Use a responsive grid-based layout.

```text
┌─────────────────────────────────────┐
│ Header / Top Navigation             │
├────────────┬────────────────────────┤
│            │                        │
│ Sidebar    │ Main Content           │
│            │                        │
│            │                        │
├────────────┴────────────────────────┤
│ Optional Bottom / Context Bar       │
└─────────────────────────────────────┘
```

### Whitespace Philosophy

* Prioritize content density for application interfaces.
* Use spacing to establish hierarchy.
* Avoid excessive empty space inside data-heavy screens.
* Allow larger spacing between major sections.
* Keep related controls visually grouped.

---

## 8. Border Radius Scale

| Level       |    Radius | Usage                     |
| ----------- | --------: | ------------------------- |
| Minimal     |       2px | Badges, tiny tags         |
| Subtle      |       4px | Compact elements          |
| Standard    |       6px | Cards, containers         |
| Comfortable |       8px | Sections, dialogs         |
| Medium      | 10px–20px | Panels, overlays          |
| Large       |     100px | Large pills               |
| Pill        |     500px | Primary buttons, search   |
| Full Pill   |    9999px | Navigation pills          |
| Circle      |       50% | Avatars, circular actions |

Radius should communicate component hierarchy rather than being applied indiscriminately.

---

## 9. Depth & Elevation

| Level       | Treatment           | Use                                   |
| ----------- | ------------------- | ------------------------------------- |
| Base        | `#121212`           | Page background                       |
| Surface     | `#181818`           | Cards, sidebar, containers            |
| Interactive | `#1f1f1f`           | Inputs, buttons, interactive surfaces |
| Elevated    | `#252525` / shadow  | Elevated cards and panels             |
| Dialog      | Heavy shadow        | Modals, overlays                      |
| Inset       | Inset border shadow | Inputs                                |

### Shadows

**Medium**

```text
rgba(0,0,0,0.3) 0px 8px 8px
```

**Heavy**

```text
rgba(0,0,0,0.5) 0px 8px 24px
```

**Inset**

```text
rgb(18,18,18) 0px 1px 0px,
rgb(124,124,124) 0px 0px 0px 1px inset
```

Use shadows to establish depth rather than excessive borders.

---

## 10. Brand Color Usage

The primary yellow is a **functional brand color**, not a decorative color.

### Use Primary For

* Primary CTAs
* Active navigation
* Selected states
* Progress indicators
* Important actions
* Primary buttons
* Active filters
* Brand-highlighted UI

### Use Primary Focus For

* Hover
* Keyboard focus
* Pressed states
* Stronger active states
* Focus borders
* Focus rings

### Do Not

* Use yellow on every interactive element.
* Fill large areas with yellow without a functional reason.
* Use yellow for ordinary body text.
* Use yellow for errors or warnings.
* Introduce competing accent colors without a product requirement.

---

## 11. Do's and Don'ts

### Do

* Use near-black backgrounds (`#121212`–`#1f1f1f`).
* Use `#F3E700` for functional brand highlights.
* Use `#FFF200` for focus and hover states.
* Use pill geometry for primary actions.
* Use circular geometry for contextual actions.
* Use uppercase + wide tracking on selected button labels.
* Keep typography compact and highly scannable.
* Use strong contrast between primary and secondary text.
* Use heavy shadows for elevated dark surfaces.
* Keep the UI predominantly achromatic apart from the brand color.

### Don't

* Don't use primary yellow purely as decoration.
* Don't use bright yellow as the default background.
* Don't introduce unnecessary competing brand colors.
* Don't use low-contrast text on dark surfaces.
* Don't use square buttons where pill geometry is appropriate.
* Don't use thin shadows that disappear against dark backgrounds.
* Don't overuse borders.
* Don't use the primary color for semantic errors or warnings.
* Don't rely on color alone to communicate state.

---

## 12. Responsive Behavior

### Breakpoints

| Name          |         Width | Key Changes           |
| ------------- | ------------: | --------------------- |
| Mobile Small  |      `<425px` | Compact mobile layout |
| Mobile        |   `425–576px` | Standard mobile       |
| Tablet        |   `576–768px` | 2-column grid         |
| Tablet Large  |   `768–896px` | Expanded layout       |
| Desktop Small |  `896–1024px` | Sidebar visible       |
| Desktop       | `1024–1280px` | Full desktop layout   |
| Large Desktop |     `>1280px` | Expanded grid         |

### Collapsing Strategy

* Sidebar: full → collapsed → hidden
* Grid: multi-column → 2 columns → 1 column
* Navigation: sidebar → bottom navigation on mobile
* Search: fixed pill → responsive width
* Cards: maintain hierarchy while reducing padding
* Tables: horizontal scroll or responsive card representation

---

## 13. Accessibility

### Contrast

Recommended text hierarchy:

```text
Primary text: #ffffff
Secondary text: #b3b3b3
Muted text: #7c7c7c
```

Primary yellow should generally be paired with dark text:

```text
Background: #F3E700
Text: #000000
```

### Focus States

Every keyboard-accessible interactive element must have a visible focus state.

```css
outline: 2px solid var(--color-primary-focus);
outline-offset: 2px;
```

### Interaction

Do not rely on color alone to communicate:

* Active state
* Error state
* Success state
* Selection
* Focus

Use icons, labels, borders, weight, or other visual indicators where appropriate.

---

## 14. Quick Color Reference

```text
Background
#121212

Surface
#181818

Interactive Surface
#1f1f1f

Elevated Surface
#252525

Alternate Elevated Surface
#272727

Light Surface
#eeeeee

Primary
#F3E700

Primary Focus
#FFF200

Primary Text
#ffffff

Secondary Text
#b3b3b3

Muted Text
#7c7c7c

Inverse Text
#000000

Border
#4d4d4d

Strong Border
#7c7c7c

Divider
#3a3a3a

Error
#f3727f

Warning
#ffa42b

Info
#539df5
```

---

## 15. Agent Prompt Guide

### Dark Card

> Create a dark card using `var(--color-surface)` with an 8px radius. Use 16px bold `var(--color-text-primary)` for the title and 14px regular `var(--color-text-secondary)` for supporting text. Add the medium elevation shadow on hover.

### Primary Button

> Create a primary pill button using `var(--color-primary)` background and `var(--color-text-inverse)` text. Use 14px weight 700 typography, uppercase text, 1.4px letter spacing, 8px 16px padding, and 9999px border radius. On hover and focus use `var(--color-primary-focus)`.

### Secondary Button

> Create a secondary pill button using `var(--color-surface-interactive)` background, `var(--color-text-primary)` text, 9999px radius, and 8px 16px padding. Keep the component visually subordinate to the primary CTA.

### Circular Action

> Create a circular primary action using `var(--color-primary)` background, `var(--color-text-inverse)` icon, 50% radius, and 12px padding. Use `var(--color-primary-focus)` on hover.

### Search Input

> Create a search input using `var(--color-surface-interactive)` background, `var(--color-text-primary)` text, 500px radius, and 12px 48px padding. On focus use `var(--color-primary-focus)` as the focus border.

### Navigation Sidebar

> Create a dark sidebar using `var(--color-background)`. Active navigation items use `var(--color-primary)` and weight 700. Inactive items use `var(--color-text-secondary)` and weight 400. Hover changes inactive items to `var(--color-text-primary)`.

---

## 16. Design Implementation Principles

When implementing this design system:

1. Start with `var(--color-background)` as the application background.
2. Build surfaces using the defined surface tokens.
3. Use `var(--color-primary)` as the primary functional brand color.
4. Use `var(--color-primary-focus)` for hover and focus states.
5. Keep the majority of the interface achromatic.
6. Use pills for primary actions.
7. Use circles for compact contextual actions.
8. Maintain strong typography hierarchy.
9. Use spacing based around a 4px/8px rhythm.
10. Use shadows to establish depth rather than excessive borders.
11. Preserve accessibility and keyboard focus states.
12. Keep semantic colors independent from the brand color.
13. Do not introduce additional brand colors without a clear product requirement.
14. Use the canonical CSS variables as the single source of truth.
15. Do not hardcode alternate values when an existing design token already represents the required role.

### Core Brand Tokens

```css
--color-primary: #F3E700;
--color-primary-focus: #FFF200;
```

These two variables define the brand interaction system. All primary actions, active states, hover states, focus states, and brand emphasis should reference these tokens rather than hardcoded color values.
