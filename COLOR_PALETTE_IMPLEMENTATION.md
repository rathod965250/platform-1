# Color Palette Implementation

This document describes the custom color palette implementation for the Aptitude Preparation Platform.

## Overview

The platform now uses a semantic color system with consistent colors across light and dark modes. All colors are defined in `src/app/globals.css` and mapped to Tailwind utility classes.

## Color Palette

### Primary Brand Color
- **Hex**: `#673DE6`
- **RGB**: `rgb(103, 61, 230)`
- **Usage**: Main CTA buttons, links, highlights
- **CSS Variable**: `--primary`
- **Tailwind Class**: `bg-primary`, `text-primary`

### Background Colors

| Role | Light Mode | Dark Mode | CSS Variable | Tailwind Class |
|------|------------|-----------|--------------|----------------|
| Primary | `#FFFFFF` | `#0F0F0F` | `--background` | `bg-background` |
| Secondary | `#F8F8F8` | `#1A1A1A` | `--background-secondary` | `bg-background-secondary` |
| Tertiary | `#F5F5F5` | `#242424` | `--background-tertiary` | `bg-background-tertiary` |
| Divider | `#E8E8E8` | `#404040` | `--background-divider` | `bg-background-divider` |

### Text Colors

| Role | Light Mode | Dark Mode | CSS Variable | Tailwind Class |
|------|------------|-----------|--------------|----------------|
| Primary | `#202020` | `#FFFFFF` | `--foreground` | `text-foreground` |
| Secondary | `#505050` | `#E0E0E0` | `--foreground-secondary` | `text-foreground-secondary` |
| Tertiary | `#808080` | `#B0B0B0` | `--foreground-tertiary` | `text-foreground-tertiary` |
| Disabled | `#A0A0A0` | `#808080` | `--foreground-disabled` | `text-foreground-disabled` |

### Accent Colors

| Role | Light Mode | Dark Mode | CSS Variable | Tailwind Class |
|------|------------|-----------|--------------|----------------|
| Accent | `#E8E0FF` | `#9B7FFF` | `--accent` | `bg-accent` |
| Accent Hover | `#5B2FD5` | `#7E5DF5` | `--accent-hover` | `bg-accent-hover` |

### Status Colors

| Status | Light Mode | Dark Mode | CSS Variable | Tailwind Class |
|--------|------------|-----------|--------------|----------------|
| Success | `#4CAF50` | `#66BB6A` | `--success` | `bg-success`, `text-success` |
| Warning | `#FF9800` | `#FFB74D` | `--warning` | `bg-warning`, `text-warning` |
| Error/Destructive | `#F44336` | `#EF5350` | `--destructive` | `bg-destructive`, `text-destructive` |
| Info | `#2196F3` | `#64B5F6` | `--info` | `bg-info`, `text-info` |

## Implementation Details

### Files Updated

1. **`src/app/globals.css`**
   - Added all color variables in `:root` (light mode)
   - Added all color variables in `.dark` (dark mode)
   - Extended `@theme inline` section with new color variables
   - All colors mapped to Tailwind utility classes

2. **`src/components/ui/button.tsx`**
   - Updated default variant to use `accent-hover` for hover state
   - Added `disabled:text-foreground-disabled` for disabled states
   - Updated destructive variant to use `destructive-foreground`

3. **`src/components/ui/badge.tsx`**
   - Added `success`, `warning`, and `info` variants
   - Updated default variant to use `accent-hover` for hover state
   - Updated destructive variant to use `destructive-foreground`

4. **`src/components/shared/LoadingSkeleton.tsx`**
   - Replaced hardcoded gray colors with semantic `background-tertiary` and `background-divider`
   - Maintains dark mode support

5. **`src/components/practice/AdaptivePracticeInterface.tsx`**
   - Replaced hardcoded colors with semantic colors:
     - `gray-*` → `foreground-secondary`, `foreground-tertiary`
     - `green-*` → `success` (for correct answers)
     - `red-*` → `destructive` (for incorrect answers)
     - `yellow-*` → `warning` (for medium difficulty)
     - `blue-*` → `primary` (for icons)
     - `orange-*` → `warning` (for streak icon)
   - Updated background gradients to use semantic background colors

## Usage Examples

### Buttons
```tsx
<Button variant="default">Primary Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
```

### Badges
```tsx
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="destructive">Error</Badge>
```

### Status Messages
```tsx
<div className="bg-success/10 border-success text-success">
  Success message
</div>

<div className="bg-warning/10 border-warning text-warning">
  Warning message
</div>

<div className="bg-destructive/10 border-destructive text-destructive">
  Error message
</div>

<div className="bg-info/10 border-info text-info">
  Info message
</div>
```

### Text Colors
```tsx
<p className="text-foreground">Primary text</p>
<p className="text-foreground-secondary">Secondary text</p>
<p className="text-foreground-tertiary">Tertiary text</p>
<p className="text-foreground-disabled">Disabled text</p>
```

### Background Colors
```tsx
<div className="bg-background">Primary background</div>
<div className="bg-background-secondary">Secondary background</div>
<div className="bg-background-tertiary">Tertiary background</div>
```

## Dark Mode

Dark mode is automatically handled through the CSS variables. The `.dark` class on the root element switches all colors to their dark mode values. The UI store (`src/store/uiStore.ts`) manages the theme switching.

## Benefits

1. **Consistency**: All components use the same color palette
2. **Maintainability**: Colors are defined in one place
3. **Accessibility**: Proper contrast ratios in both modes
4. **Semantic**: Colors have clear meanings (success, warning, error)
5. **Type-safe**: Tailwind classes provide autocomplete and type checking

## Future Enhancements

- Add color palette documentation to Storybook (if implemented)
- Create color swatch component for design system
- Add contrast ratio testing
- Consider adding more semantic colors (neutral, muted, etc.)

