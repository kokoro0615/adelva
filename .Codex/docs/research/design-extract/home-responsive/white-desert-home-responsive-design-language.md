# Design Language: Luxury Adventures in Antarctica | White Desert

> Extracted from `https://white-desert.com/` on August 30, 2026
> 1102 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#f3f1ec` | rgb(243, 241, 236) | hsl(43, 23%, 94%) | 19 |
| Secondary | `#1f2a44` | rgb(31, 42, 68) | hsl(222, 37%, 19%) | 876 |
| Accent | `#ff7e15` | rgb(255, 126, 21) | hsl(27, 100%, 54%) | 6 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#ffffff` | hsl(0, 0%, 100%) | 813 |
| `#000000` | hsl(0, 0%, 0%) | 270 |
| `#535353` | hsl(0, 0%, 33%) | 234 |
| `#090b10` | hsl(223, 28%, 5%) | 2 |
| `#e9e7e1` | hsl(45, 15%, 90%) | 2 |
| `#c0c0c0` | hsl(0, 0%, 75%) | 2 |

### Background Colors

Used on large-area elements: `#ffffff`, `#000000`, `#1f2a44`, `#090b10`, `#f5f5f5`, `#e9e7e1`

### Text Colors

Text color palette: `#000000`, `#1f2a44`, `#ffffff`, `#ff7e15`, `#535353`, `#c0c0c0`

### Gradients

```css
background-image: linear-gradient(rgba(31, 42, 68, 0.3) 0%, rgba(31, 42, 68, 0.3) 100%), none;
```

```css
background-image: repeating-linear-gradient(90deg, rgba(44, 55, 75, 0.4) 0px, rgba(44, 55, 75, 0.4) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 4px);
```

```css
background-image: linear-gradient(360deg, rgb(255, 255, 255), rgba(0, 0, 0, 0) 15%);
```

```css
background-image: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0px, rgba(255, 255, 255, 0.4) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 4px);
```

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#1f2a44` | text, border, background | 876 |
| `#ffffff` | background, text, border | 813 |
| `#000000` | text, border, background | 270 |
| `#535353` | text, border | 234 |
| `#f3f1ec` | background | 19 |
| `#ff7e15` | background, text, border | 6 |
| `#6af0ff` | background, border | 5 |
| `#090b10` | background | 2 |
| `#e9e7e1` | background | 2 |
| `#c0c0c0` | text, border | 2 |

## Typography

### Font Families

- **Inter Tight** — used for all (825 elements)
- **Arial** — used for all (122 elements)
- **Times New Roman** — used for all (96 elements)
- **Cardinal Classic Long** — used for all (40 elements)
- **Oswald** — used for all (19 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 284.444px | 17.7778rem | 400 | 256px | normal | h2, br |
| 227.555px | 14.2222rem | 400 | 227.555px | normal | h1 |
| 124.444px | 7.7778rem | 500 | normal | normal | h2 |
| 53.3333px | 3.3333rem | 400 | 53.3333px | normal | h3 |
| 46.2222px | 2.8889rem | 400 | 0px | normal | div |
| 37.3333px | 2.3333rem | 400 | 37.3333px | normal | h3 |
| 32px | 2rem | 400 | 0px | normal | div |
| 28.4444px | 1.7778rem | 500 | 34.1333px | normal | p, h3 |
| 19.5555px | 1.2222rem | 500 | 23.4666px | normal | p |
| 17.7778px | 1.1111rem | 500 | 21.3333px | normal | p |
| 16px | 1rem | 400 | normal | normal | html, head, meta, link |
| 14.2222px | 0.8889rem | 400 | normal | normal | body, div, nav, ul |
| 14px | 0.875rem | 500 | 16.8px | normal | div, span, p, a |
| 12.4444px | 0.7778rem | 500 | 18.6666px | normal | span, p, div, br |
| 10.6667px | 0.6667rem | 500 | 12.8px | normal | p, a, span |

### Heading Scale

```css
h2 { font-size: 284.444px; font-weight: 400; line-height: 256px; }
h1 { font-size: 227.555px; font-weight: 400; line-height: 227.555px; }
h2 { font-size: 124.444px; font-weight: 500; line-height: normal; }
h3 { font-size: 53.3333px; font-weight: 400; line-height: 53.3333px; }
h3 { font-size: 37.3333px; font-weight: 400; line-height: 37.3333px; }
h3 { font-size: 28.4444px; font-weight: 500; line-height: 34.1333px; }
h3 { font-size: 16px; font-weight: 400; line-height: normal; }
```

### Body Text

```css
body { font-size: 14.2222px; font-weight: 400; line-height: normal; }
```

### Font Weights in Use

`400` (951x), `500` (140x), `600` (11x)

## Spacing

| Token | Value | Rem |
|-------|-------|-----|
| spacing-4 | 4px | 0.25rem |
| spacing-21 | 21px | 1.3125rem |
| spacing-24 | 24px | 1.5rem |
| spacing-36 | 36px | 2.25rem |
| spacing-39 | 39px | 2.4375rem |
| spacing-53 | 53px | 3.3125rem |
| spacing-58 | 58px | 3.625rem |
| spacing-71 | 71px | 4.4375rem |
| spacing-89 | 89px | 5.5625rem |
| spacing-111 | 111px | 6.9375rem |
| spacing-124 | 124px | 7.75rem |
| spacing-142 | 142px | 8.875rem |
| spacing-178 | 178px | 11.125rem |
| spacing-227 | 227px | 14.1875rem |
| spacing-284 | 284px | 17.75rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| xs | 2px | 44 |
| sm | 5px | 20 |
| full | 50px | 3 |
| full | 100px | 3 |

## Box Shadows

**xs (inset)** — blur: 0px
```css
box-shadow: rgba(255, 255, 255, 0.2) 0.35px 0.35px 0px 0px inset, rgba(255, 255, 255, 0.2) 0px 0px 1.75px 0px inset;
```

## CSS Custom Properties

### Colors

```css
--bg: #fff;
--quote-accent: var(--WD_Dark-Blue,#1f2a44);
--muted: #a8acb3;
--primary: #6aa5ff;
--primary-contrast: #0b0c0f;
--border: #1f2330;
--dark-bg: #090b10;
--foreground: var(--text);
```

### Spacing

```css
--space-1: .35em;
--space-2: .75em;
--space-3: 1.1em;
--space-4: 1.5em;
--space-5: 2em;
--space-6: 2.75em;
--space-8: 4em;
--space-10: 5.5em;
--space-12: 7em;
--size-03125: .3125em;
--size-0375: .375em;
--size-05: .5em;
--size-0625: .625em;
--size-075: .75em;
--size-0875: .875em;
--size-1: 1em;
--size-1125: 1.125em;
--size-125: 1.25em;
--size-1375: 1.375em;
--size-15: 1.5em;
--size-1625: 1.625em;
--size-175: 1.75em;
--size-1875: 1.875em;
--size-2: 2em;
--size-225: 2.25em;
--size-25: 2.5em;
--size-2625: 2.625em;
--size-3: 3em;
--size-3125: 3.125em;
--size-325: 3.25em;
--size-375: 3.75em;
--size-425: 4.25em;
--size-475: 4.75em;
--size-5: 5em;
--size-5625: 5.625em;
--size-6: 6em;
--size-625: 6.25em;
--size-6875: 6.875em;
--size-7375: 7.375em;
--size-75: 7.5em;
--size-78125: 7.8125em;
--size-875: 8.75em;
--size-12-5: 12.5em;
--size-10: 10em;
--size-15-5: 15.5em;
--size-16: 16em;
--size-20: 20em;
--size-24: 24em;
--section-padding-lg: 20em;
```

### Typography

```css
--text: var(--wd_dark-blue);
--font-sans: "Inter Tight",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
--font-display: "Cardinal Classic Long",ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;
--font-condensed: "Oswald","Arial Narrow",Arial,sans-serif;
```

### Shadows

```css
--shadow-1: 0 1px 2px rgba(0,0,0,.06),0 1px 1px rgba(0,0,0,.04);
--shadow-2: 0 4px 10px rgba(0,0,0,.08),0 2px 4px rgba(0,0,0,.06);
```

### Radii

```css
--radius-0125: .125em;
--radius-sm: .25em;
--radius-hover: .275em;
--radius-0375: .375em;
--radius-0625: .625em;
--radius-md: .5em;
--radius-lg: 2.5em;
```

### Other

```css
--surface: #12141a;
--white: #fff;
--black: #000;
--black-faded: rgba(0,0,0,.5);
--background: var(--bg);
--wd_dark-blue: #1f2a44;
--wd_deep-blue: #0e1118;
--wd-grey: #323640;
--wd_dark-blue-faded: rgba(31,42,68,.2);
--wd_blue-faded: rgba(31,42,68,.5);
--wd_ash-blue: #2c374b;
--wd_orange: #ff7e15;
--wd_red: #ff1515;
--wd_white: #fff;
--wd_black: #000;
--wd_light-charcoal: #535353;
--wd_light-charcoal-faded: #a4a29c;
--wd_mushroom: #e9e7e1;
--wd_light-grey: #f3f1ec;
--wd_beige: #dcd8cc;
--wd_turqoise: #6af0ff;
--container-max: 100%;
--container-pad: var(--size-125);
--grid-columns: 12;
--gutter-x: var(--space-2);
--gutter-y: var(--space-4);
--lh-90: .9;
--lh-100: 1;
--lh-110: 1.1;
--lh-120: 1.2;
--lh-130: 1.3;
--lh-140: 1.4;
--lh-150: 1.5;
--transition-ease-in-out: all .3s ease-in-out;
--transition-ease-in: all .3s ease-in;
--transition-ease-out: all .3s cubic-bezier(.5,1,.89,1);
--transform-ease-out: transform .3s cubic-bezier(.5,1,.89,1);
--transition-wd: all .45s cubic-bezier(.76,0,.24,1);
```

### Dependencies

```css
0: --wd_dark-blue;
0: --WD_Dark-Blue;
0: --bg;
0: --text;
0: --size-125;
0: --space-2;
0: --space-4;
```

### Semantic

```css
--wd_red: #ff1515;
--wd_dark-blue: #1f2a44;
--wd_deep-blue: #0e1118;
--wd_dark-blue-faded: rgba(31,42,68,.2);
--wd_blue-faded: rgba(31,42,68,.5);
--wd_ash-blue: #2c374b;
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 540px | max-width |
| md | 767px | max-width |
| md | 768px | max-width |
| md | 769px | min-width |
| lg | 1023px | max-width |
| xl | 1279px | max-width |
| 2xl | 1560px | min-width |

## Transitions & Animations

**Easing functions:** `cubic-bezier(0.5, 1, 0.89, 1)`, `cubic-bezier(0.4, 0, 0.2, 1)`, `ease`, `cubic-bezier(0.76, 0, 0.24, 1)`, `cubic-bezier(0.16, 1, 0.3, 1)`

**Durations:** `0.3s`, `0s`, `0.6s`, `0.4s`, `0.45s`, `1s`

### Common Transitions

```css
transition: all;
transition: color 0.3s;
transition: 0.3s cubic-bezier(0.5, 1, 0.89, 1);
transition: visibility 0s 0.6s;
transition: opacity 0.4s;
transition: opacity 0.3s;
transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
transition: width 0.3s ease-in-out;
transition: 0.45s cubic-bezier(0.76, 0, 0.24, 1);
transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
```

### Keyframe Animations

**page-exit**
```css
@keyframes page-exit {
  0% { filter: brightness(); }
  100% { filter: brightness(0.25); }
}
```

**page-enter**
```css
@keyframes page-enter {
  0% { clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%); }
  100% { clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }
}
```

**reveal-opacity**
```css
@keyframes reveal-opacity {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

**reveal-transform**
```css
@keyframes reveal-transform {
  0% { transform: translateY(20rem); }
  100% { transform: translateY(0px); }
}
```

**fadeIn**
```css
@keyframes fadeIn {
  100% { opacity: 1; }
}
```

**pulsed**
```css
@keyframes pulsed {
  0% { opacity: 1; width: 100%; height: 100%; }
  59.9% { opacity: 0; width: 500%; height: 500%; }
  60%, 100% { opacity: 0; width: 100%; height: 100%; }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (34 instances)

```css
.buttons {
  background-color: rgb(243, 241, 236);
  color: rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Cards (74 instances)

```css
.cards {
  background-color: rgba(0, 0, 0, 0.01);
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Inputs (2 instances)

```css
.inputs {
  color: rgb(0, 0, 0);
  border-color: rgb(0, 0, 0);
  border-radius: 0px;
  font-size: 12.4444px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Links (65 instances)

```css
.links {
  color: rgb(83, 83, 83);
  font-size: 12.4444px;
  font-weight: 500;
}
```

### Navigation (24 instances)

```css
.navigation {
  background-color: rgb(239, 239, 239);
  color: rgb(31, 42, 68);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: static;
}
```

### Footer (96 instances)

```css
.footer {
  background-color: rgb(233, 231, 225);
  color: rgb(83, 83, 83);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 14.2222px;
}
```

### Modals (54 instances)

```css
.modals {
  background-color: rgba(0, 0, 0, 0.01);
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
  max-width: calc(100% - 106.667px);
}
```

### Dropdowns (40 instances)

```css
.dropdowns {
  background-color: rgb(239, 239, 239);
  border-radius: 0px;
  border-color: rgb(31, 42, 68);
  padding-top: 0px;
}
```

### Badges (11 instances)

```css
.badges {
  color: rgb(83, 83, 83);
  font-size: 14.2222px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

### Tabs (3 instances)

```css
.tabs {
  background-color: rgba(31, 42, 68, 0.2);
  color: rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 14.2222px;
  border-color: rgb(255, 255, 255);
  border-radius: 2px;
}
```

### Accordions (6 instances)

```css
.accordions {
  background-color: rgb(239, 239, 239);
  color: rgb(0, 0, 0);
  font-size: 14.2222px;
  padding-top: 0px;
  padding-right: 0px;
  border-color: rgb(0, 0, 0);
}
```

### Switches (2 instances)

```css
.switches {
  background-color: rgb(239, 239, 239);
  border-radius: 0px;
  border-color: rgb(0, 0, 0);
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 5 instances, 3 variants

**Variant 1** (3 instances)

```css
  background: rgba(31, 42, 68, 0.2);
  color: rgb(255, 255, 255);
  padding: 0px 14.2222px 0px 14.2222px;
  border-radius: 2px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

**Variant 2** (1 instance)

```css
  background: rgb(255, 126, 21);
  color: rgb(255, 255, 255);
  padding: 0px 42.6666px 0px 42.6666px;
  border-radius: 3.55555px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

**Variant 3** (1 instance)

```css
  background: rgb(243, 241, 236);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 1.77778px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 14.2222px;
  font-weight: 400;
```

### Button — 6 instances, 2 variants

**Variant 1** (3 instances)

```css
  background: rgba(31, 42, 68, 0.15);
  color: rgb(255, 255, 255);
  padding: 0px 14.2222px 0px 14.2222px;
  border-radius: 1.77778px;
  border: 0px none rgba(31, 42, 68, 0.2);
  font-size: 14.2222px;
  font-weight: 400;
```

**Variant 2** (3 instances)

```css
  background: rgb(243, 241, 236);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 1.77778px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 14.2222px;
  font-weight: 400;
```

### Button — 3 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 4.97777px 28.4444px 4.97777px 28.4444px;
  border-radius: 0px;
  border: 1px 0px solid none rgba(255, 255, 255, 0.2) rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

**Variant 2** (2 instances)

```css
  background: rgb(239, 239, 239);
  color: rgb(255, 255, 255);
  padding: 4.97777px 28.4444px 4.97777px 28.4444px;
  border-radius: 1.77778px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 6 instances, 2 variants

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 3.55555px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

**Variant 2** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 39.1111px 39.1111px 39.1111px 39.1111px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Link — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0.01);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 8 instances, 1 variant

**Variant 1** (8 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 37.3333px;
  font-weight: 500;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 4 instances, 1 variant

**Variant 1** (4 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 9 instances, 1 variant

**Variant 1** (9 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 600;
```

### Card — 5 instances, 1 variant

**Variant 1** (5 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 500;
```

### Card — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Link — 3 instances, 1 variant

**Variant 1** (3 instances)

```css
  background: rgba(31, 42, 68, 0.05);
  color: rgb(255, 255, 255);
  padding: 17.7778px 17.7778px 17.7778px 17.7778px;
  border-radius: 5.33333px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Card — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(255, 255, 255);
  padding: 0px 0px 0px 0px;
  border-radius: 5.33333px;
  border: 0px none rgb(255, 255, 255);
  font-size: 14.2222px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 0px 0px 0px 0px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14.2222px;
  font-weight: 400;
```

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: rgb(31, 42, 68);
  padding: 10px 16px 10px 10px;
  border-radius: 0px;
  border: 0px none rgb(31, 42, 68);
  font-size: 14px;
  font-weight: 400;
```

## Layout System

**23 grid containers** and **181 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 1280px | 0px |
| calc(100% - 106.667px) | 0px |
| calc(100% - 21.3333px) | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 12-column | 16x |
| 1-column | 5x |
| 13-column | 1x |
| 2-column | 1x |

### Grid Templates

```css
grid-template-columns: 1280px;
grid-template-columns: 104.875px 104.875px 104.891px 104.891px 104.891px 104.891px 104.875px 104.875px 104.891px 104.891px 104.891px 104.891px;
gap: 21.3333px 0px;
grid-template-columns: 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.125px 95.125px 95.125px 95.125px;
gap: 21.3333px 10.6667px;
grid-template-columns: 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px 95.1094px;
gap: 21.3333px 10.6667px;
grid-template-columns: 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9688px 90.9844px;
gap: 21.3333px 10.6667px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| row/nowrap | 96x |
| column/nowrap | 84x |
| row/wrap | 1x |

**Gap values:** `1.77778px normal`, `10.6667px`, `10.6667px normal`, `12.4444px`, `14.2222px normal`, `15.6444px`, `17.7778px normal`, `177.778px normal`, `18px`, `21.3333px`, `21.3333px 0px`, `21.3333px 10.6667px`, `21.3333px normal`, `24px`, `26.6666px normal`, `28.4444px normal`, `4.44444px`, `4.44444px normal`, `5px normal`, `7.1111px`, `7.1111px normal`, `7.77777px`, `8.88888px`, `8.88888px normal`, `normal 17.7778px`, `normal 4.97777px`, `normal 8.88888px`

## Responsive Design

### Viewport Snapshots

| Viewport | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
|----------|-----------|-------------|-------------|-----------|-------------|
| mobile (375px) | 16px | Yes | 10 | Yes | 18771px |
| tablet (768px) | 16px | Yes | 13 | Yes | 20085px |
| desktop (1280px) | 14.2222px | Yes | 13 | Yes | 18488px |
| wide (1920px) | 17.3333px | Yes | 13 | Yes | 25338px |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):
- H1 size: `80px` → `256px`
- Max grid columns: `10` → `13`
- Page height: `18771px` → `20085px`

**768px → 1280px** (tablet → desktop):
- Body font size: `16px` → `14.2222px`
- H1 size: `256px` → `227.555px`
- Page height: `20085px` → `18488px`

**1280px → 1920px** (desktop → wide):
- Body font size: `14.2222px` → `17.3333px`
- H1 size: `227.555px` → `277.333px`
- Page height: `18488px` → `25338px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 0 passing, 0 failing color pairs

## Design System Score

**Overall: 82/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 50/100 |
| Spacing System | 70/100 |
| Shadow Consistency | 100/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 100/100 |

**Strengths:** Tight, disciplined color palette, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 5 font families — consider limiting to 2 (heading + body)
- 15 !important rules — prefer specificity over overrides
- 57% of CSS is unused — consider purging
- 1911 duplicate CSS declarations

## Gradients

**4 unique gradients** detected.

| Type | Direction | Stops | Classification |
|------|-----------|-------|----------------|
| linear | — | 2 | brand |
| repeating-linear | 90deg | 4 | bold |
| linear | 360deg | 2 | brand |
| repeating-linear | 90deg | 4 | bold |

```css
background: linear-gradient(rgba(31, 42, 68, 0.3) 0%, rgba(31, 42, 68, 0.3) 100%);
background: repeating-linear-gradient(90deg, rgba(44, 55, 75, 0.4) 0px, rgba(44, 55, 75, 0.4) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 4px);
background: linear-gradient(360deg, rgb(255, 255, 255), rgba(0, 0, 0, 0) 15%);
background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0px, rgba(255, 255, 255, 0.4) 2px, rgba(0, 0, 0, 0) 2px, rgba(0, 0, 0, 0) 4px);
```

## Z-Index Map

**10 unique z-index values** across 2 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 9998,999999999 | div.m.e.n.u.-.c.o.m.p.o.n.e.n.t, nav, div.f.l.y.o.u.t._.c.o.n.t.a.i.n.e.r. .i.s.-.r.e.a.d.y. .i.s.-.s.t.i.c.k.y |
| base | 0,4 | div.l.i.q.u.i.d.-.g.l.a.s.s._._.f.i.l.t.e.r, div.l.i.q.u.i.d.-.g.l.a.s.s._._.f.i.l.t.e.r, div.l.i.q.u.i.d.-.g.l.a.s.s._._.f.i.l.t.e.r |

**Issues:**
- Very high z-index values: 10000, 10001, 999999999

## SVG Icons

**4 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| xs | 1 |
| sm | 1 |
| xl | 2 |

**Icon colors:** `currentColor`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| Inter Tight | self-hosted | 500 | normal, italic |
| Cardinal Classic Long | self-hosted | 400, 500, 600, 700 | normal, italic |
| Oswald | self-hosted | 400, normal | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| hero | 16 | objectFit: cover, borderRadius: 0px, shape: square |
| thumbnail | 9 | objectFit: cover, borderRadius: 0px, shape: square |
| gallery | 1 | objectFit: fill, borderRadius: 0px, shape: square |
| general | 1 | objectFit: cover, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (13x), 3:2 (7x), 4:3 (3x), 2:1 (1x), 3:4 (1x), 16:9 (1x), 4.13:1 (1x)

## Motion Language

**Feel:** mixed · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `md` | `300ms` | 300 |
| `lg` | `450ms` | 450 |
| `xl` | `1s` | 1000 |

### Easing Families

- **ease-in** (127 uses) — `cubic-bezier(0.5, 1, 0.89, 1)`
- **custom** (9 uses) — `cubic-bezier(0.4, 0, 0.2, 1)`, `cubic-bezier(0.76, 0, 0.24, 1)`
- **ease-in-out** (1 uses) — `ease`
- **ease-out** (1 uses) — `cubic-bezier(0.16, 1, 0.3, 1)`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `reveal-transform` | slide-y | transform | 1 |
| `pulsed` | fade | opacity, width, height | 3 |

## Component Anatomy

### card — 66 instances

**Slots:** media

### button — 17 instances

**Slots:** label
**Sizes:** large

### link — 8 instances


## Brand Voice

**Tone:** friendly · **Pronoun:** you-only · **Headings:** Title Case (balanced)

### Top CTA Verbs

- **enquire** (3)
- **watch** (3)
- **south** (2)
- **get** (2)
- **how** (2)
- **experience** (1)
- **operation** (1)
- **about** (1)

### Button Copy Patterns

- "watch film" (3×)
- "enquire now" (2×)
- "how it works
close" (2×)
- "experience" (1×)
- "operation" (1×)
- "about" (1×)
- "rates" (1×)
- "enquire" (1×)
- "baby penguins & blue tunnels
us $75,250
early season

witness the emperor chicks as they take their first steps and explore the ethereal blue ice tunnels." (1×)
- "south pole & penguins
us $115,500

our most popular itinerary, which includes a journey to the south pole — visited by fewer than 500 people each year — and a v" (1×)

### Sample Headings

> ANTARCTICA
> VAST, MAJESTIC AND UNIMAGINABLY BEAUTIFUL — SETTING FOOT IN ANTARCTICA’S FABLED INTERIOR REMAINS A RARE AND EXTRAORDINARY EXPERIENCE.
> OUR TRIPS
> Baby Penguins & Blue Tunnels
> South Pole & Penguins
> VAST, MAJESTIC AND UNIMAGINABLY BEAUTIFUL — SETTING FOOT IN ANTARCTICA’S FABLED INTERIOR REMAINS A RARE AND EXTRAORDINARY EXPERIENCE.
> OUR TRIPS
> Baby Penguins & Blue Tunnels
> South Pole & Penguins
> South Pole & Blue Rivers

## Page Intent

**Type:** `landing` (confidence 0.31)
**Description:** White Desert is the world’s leading luxury Antarctic expedition company, offering once-in-a-lifetime journeys to the South Pole and Emperor Penguins

Alternates: blog-post (0.35)

## Section Roles

Reading order (top→bottom): pricing-table → testimonial → content → content → nav → pricing-table → testimonial → testimonials → hero

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | nav | — | 0.9 |
| 1 | pricing-table | ANTARCTICA | 0.9 |
| 2 | testimonial | VAST, MAJESTIC AND UNIMAGINABLY BEAUTIFUL — SETTING FOOT IN ANTARCTICA’S FABLED  | 0.8 |
| 3 | content | — | 0.3 |
| 4 | content | OUR TRIPS | 0.3 |
| 5 | pricing-table | Baby Penguins & Blue Tunnels | 0.9 |
| 6 | testimonial | — | 0.8 |
| 7 | testimonials | TO THE END OF THE EARTH | 0.4 |
| 8 | hero | START PLANNING YOUR ADVENTURE | 0.4 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.255 |
| Shadow profile | soft |
| Avg shadow blur | 0px |
| Max radius | 100px |
| backdrop-filter in use | no |
| Gradients | 4 |

## Imagery Style

**Label:** `gradient-mesh` (confidence 0.062)
**Counts:** total 27, svg 0, icon 6, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** square

## Component Library

**Detected:** `vuetify` (confidence 0.46)

Evidence:
- 8 v-* classes

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `Inter Tight` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
