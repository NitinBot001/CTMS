# DESIGN.md --- Visual Design System

> **Purpose:** This document defines ONLY the visual design language to
> be used across the application.
>
> **Important:** Do not copy the reference application's page structure,
> navigation, workflows, components, business logic, forms, dashboards,
> or information architecture. The current application's existing
> Next.js architecture, modular components, routes, workflows, APIs,
> state management, permissions, and project-specific UX remain
> authoritative.

------------------------------------------------------------------------

## 1. Design-System Scope

This design system provides only:

-   Typography
-   Color palette
-   Visual hierarchy
-   Spacing principles
-   Border/radius language
-   Surface treatment
-   Button visual language
-   Form visual language
-   Status colors
-   Focus states
-   Icon visual style
-   Motion principles
-   Responsive visual principles
-   Accessibility-related visual rules

It does **NOT** define:

-   Application routes
-   Page layouts
-   Sidebar structure
-   Dashboard structure
-   Database models
-   API contracts
-   Business logic
-   Authentication flow
-   RBAC/permissions
-   Protocol workflow
-   CTMS workflow
-   Component architecture
-   State management
-   Backend architecture
-   Folder structure
-   Data fetching
-   Server/client component decisions

Those must remain defined by the actual project.

------------------------------------------------------------------------

# 2. Core Design Concept

The visual concept should be:

> **Modern institutional + clinical + trustworthy + restrained**

The reference UI establishes this visual direction through:

-   Deep maroon identity color
-   Darker maroon for strong emphasis
-   Muted institutional green
-   Warm gold accent
-   Warm off-white surfaces
-   Dark neutral typography
-   Serif display typography
-   Sans-serif interface typography
-   Thin borders
-   Minimal corner rounding
-   Minimal shadows
-   Restrained animation

The supplied reference uses `#7A2A12` maroon, `#5C1F0D` dark maroon,
`#1F5C3F` green, `#B8862E` gold, `#1C1A17` ink and `#F8F6F2` soft
background. fileciteturn0file0L11-L20

The reference also uses Merriweather for headings and Source Sans 3 for
interface/body text. fileciteturn0file0L25-L35

------------------------------------------------------------------------

# 3. Non-Negotiable Architecture Rule

## Visual design must never dictate application architecture.

When implementing this design system:

### DO

-   Add reusable design tokens.
-   Add reusable visual primitives.
-   Style existing modular components.
-   Preserve existing component APIs where possible.
-   Preserve current routes.
-   Preserve current business logic.
-   Preserve existing state management.
-   Preserve current API integrations.
-   Preserve current data models.
-   Extend components only when required by the actual application.

### DO NOT

-   Rebuild the application based on the reference HTML.
-   Copy the reference landing page structure.
-   Introduce unnecessary components only because they existed in the
    reference.
-   Replace existing navigation without project requirements.
-   Replace an existing dashboard with the reference layout.
-   Create a new architecture solely to match visual styling.
-   Move business logic into UI components.
-   Couple visual tokens to business/domain logic.

------------------------------------------------------------------------

# 4. Design Token Layer

The visual system should be implemented as centralized design tokens.

For a Next.js application, prefer CSS variables as the source of truth.

Example:

``` css
:root {
  /* Brand */
  --color-primary: #7A2A12;
  --color-primary-dark: #5C1F0D;
  --color-secondary: #1F5C3F;
  --color-accent: #B8862E;

  /* Text */
  --color-text: #1C1A17;
  --color-text-secondary: #5A5347;
  --color-text-muted: #726B5C;
  --color-text-inverse: #FFFFFF;

  /* Surfaces */
  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F8F6F2;

  /* Borders */
  --color-border: #E4DED3;
  --color-border-strong: #C9C2B3;

  /* Semantic */
  --color-success: #1F5C3F;
  --color-warning: #B8862E;
  --color-danger: #9B2C2C;
  --color-info: #315A78;

  /* Focus */
  --color-focus: #B8862E;
}
```

The actual project may extend these tokens when required.

Do not create competing color systems inside individual components.

------------------------------------------------------------------------

# 5. Color Philosophy

## 5.1 Primary --- Maroon

``` text
#7A2A12
```

Use for:

-   Primary actions
-   Important interactive elements
-   Selected states
-   Brand identity
-   Important headings when appropriate
-   Active navigation indicators
-   Primary links

Do not use primary maroon as the background of every card or section.

------------------------------------------------------------------------

## 5.2 Primary Dark

``` text
#5C1F0D
```

Use for:

-   Strong institutional surfaces
-   Footer/header identity areas
-   Hover/pressed states
-   High-emphasis navigation surfaces

------------------------------------------------------------------------

## 5.3 Secondary --- Green

``` text
#1F5C3F
```

Use for:

-   Positive/verified states
-   Success
-   Completion
-   Secondary institutional accents
-   Valid states
-   Positive clinical/status information

Green should not automatically mean "primary button."

------------------------------------------------------------------------

## 5.4 Accent --- Gold

``` text
#B8862E
```

Use sparingly for:

-   Focus indicators
-   Important accents
-   Attention/warning
-   Section dividers
-   Small visual highlights

Gold is an accent, not a dominant UI color.

------------------------------------------------------------------------

## 5.5 Neutral Surfaces

Main background:

``` text
#FFFFFF
```

Soft background:

``` text
#F8F6F2
```

Use the soft background to visually separate sections without
introducing additional colors.

------------------------------------------------------------------------

# 6. Semantic Color Rules

Every status must have a semantic meaning.

  State            Token
  ---------------- -------------------
  Success          `--color-success`
  Warning          `--color-warning`
  Error/Critical   `--color-danger`
  Informational    `--color-info`
  Default          neutral colors

Do not use arbitrary colors such as purple, cyan, pink, neon green, etc.
unless the application's domain requires them.

If the project requires additional categories, add them as named
semantic tokens instead of using random hex values.

------------------------------------------------------------------------

# 7. Typography

## 7.1 Font families

Primary heading font:

``` css
--font-heading: "Merriweather", Georgia, serif;
```

Primary interface font:

``` css
--font-body: "Source Sans 3", system-ui, sans-serif;
```

The reference explicitly uses Merriweather for headings and Source Sans
3 for body/interface text. fileciteturn0file0L7-L9

------------------------------------------------------------------------

# 8. Typography Concept

Use typography to establish hierarchy rather than relying on cards,
colors, or large icons.

### Headings

Serif.

Characteristics:

-   Institutional
-   Editorial
-   Trustworthy
-   Strong

### Interface text

Sans-serif.

Characteristics:

-   Functional
-   Readable
-   Compact
-   Clear

This combination should be consistent throughout the application.

------------------------------------------------------------------------

# 9. Typography Scale

Recommended starting scale:

``` css
--text-xs: 12px;
--text-sm: 13px;
--text-md: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 28px;
--text-4xl: 36px;
```

These are starting tokens, not rigid requirements.

The actual component should choose the appropriate size based on
context.

------------------------------------------------------------------------

# 10. Typography Rules

## Page titles

Use:

-   Merriweather
-   28--36px desktop
-   24--30px mobile
-   Weight 700--900

## Section headings

Use:

-   Merriweather
-   20--28px

## Component headings

Use:

-   Merriweather
-   17--20px

## Body

Use:

-   Source Sans 3
-   15--16px
-   Line-height 1.5--1.65

## Labels

Use:

-   Source Sans 3
-   13--14px
-   Weight 600

## Helper text

Use:

-   Source Sans 3
-   12--14px
-   Muted color

------------------------------------------------------------------------

# 11. Spacing

Use a predictable spacing scale.

``` css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 32px;
--space-8: 40px;
--space-9: 48px;
--space-10: 56px;
--space-11: 64px;
--space-12: 80px;
```

The reference uses generous section spacing and structured internal
spacing. fileciteturn0file0L64-L96

Do not add arbitrary spacing values everywhere.

If a new spacing value is genuinely required, first check whether an
existing token can be reused.

------------------------------------------------------------------------

# 12. Border Language

The design should feel structured rather than floating.

Default border:

``` css
border: 1px solid var(--color-border);
```

Strong border:

``` css
border: 1px solid var(--color-border-strong);
```

Accent border:

``` css
border-left: 4px solid var(--color-secondary);
```

The reference relies heavily on thin borders rather than strong shadows.
fileciteturn0file0L79-L84

------------------------------------------------------------------------

# 13. Border Radius

The reference uses an intentionally restrained radius.

Default:

``` css
--radius-sm: 2px;
```

Optional modern extensions:

``` css
--radius-md: 4px;
--radius-lg: 6px;
```

Use larger rounding only if the current application's UX requires it.

Avoid:

-   Excessive rounded cards
-   Huge 16--24px radius containers
-   Fully rounded buttons everywhere

Pills may be used for:

-   Status badges
-   Tags
-   Compact filters

------------------------------------------------------------------------

# 14. Shadows

Shadows should be subtle.

Default components should generally use borders rather than shadows.

If elevation is required:

``` css
box-shadow: 0 2px 8px rgba(28, 26, 23, 0.08);
```

Use elevation mainly for:

-   Dropdowns
-   Popovers
-   Dialogs
-   Floating menus
-   Temporary overlays

Do not turn every card into a floating object.

------------------------------------------------------------------------

# 15. Surface Hierarchy

Use a small number of surfaces.

Recommended:

``` text
Background
  ↓
Soft section surface
  ↓
White content surface
  ↓
Border
  ↓
Optional elevated overlay
```

Example:

``` text
#FFFFFF
#F8F6F2
#FFFFFF + #E4DED3 border
```

Avoid creating many near-identical gray shades.

------------------------------------------------------------------------

# 16. Buttons

The visual language for buttons comes from the reference's restrained
maroon action buttons. fileciteturn0file0L71-L78

## Primary

``` css
background: var(--color-primary);
color: var(--color-text-inverse);
border: 1px solid var(--color-primary);
```

## Secondary

``` css
background: transparent;
color: var(--color-primary);
border: 1px solid var(--color-primary);
```

## Destructive

Use `--color-danger`.

## Success

Use `--color-success` only when the action genuinely represents a
positive/confirmation operation.

Buttons should be visually clear without becoming oversized.

------------------------------------------------------------------------

# 17. Form Controls

Inputs should use the same restrained visual language.

Recommended:

``` css
border: 1px solid var(--color-border-strong);
background: var(--color-surface);
border-radius: var(--radius-sm);
```

The reference uses approximately 10--12px vertical/horizontal input
padding and a gold focus outline. fileciteturn0file0L114-L120

Focus:

``` css
outline: 2px solid var(--color-focus);
outline-offset: 1px;
border-color: var(--color-primary);
```

Never remove the focus indicator.

------------------------------------------------------------------------

# 18. Component Visual Rules

The application will contain its own modular components.

Each component should consume the shared design tokens.

Example:

``` text
Button
Card
Input
Select
Textarea
Dialog
Tabs
Badge
Tooltip
Dropdown
Table
Pagination
Alert
Toast
```

The visual design system styles these primitives.

The application itself decides:

-   Which components exist
-   Where they are used
-   What data they receive
-   What actions they perform
-   Which pages contain them

------------------------------------------------------------------------

# 19. Existing Modular Architecture Must Be Preserved

When implementing the design in Next.js:

``` text
Existing application architecture
            ↓
Existing components
            ↓
Shared visual tokens
            ↓
Component-level styling
            ↓
Project-specific screens
```

Not:

``` text
Reference HTML
      ↓
Copy page
      ↓
Rewrite application
```

The reference is a **visual source**, not an application blueprint.

------------------------------------------------------------------------

# 20. Next.js Implementation Guidance

The project is built with Next.js.

Therefore the design system should integrate naturally with the existing
stack.

Recommended approach:

``` text
app/
components/
features/
lib/
styles/
```

The exact project structure must remain whatever the project already
uses.

Do not reorganize folders merely to implement this design.

Global tokens can live in the application's existing global stylesheet,
for example:

``` css
:root {
  --color-primary: #7A2A12;
  --color-primary-dark: #5C1F0D;
  --color-secondary: #1F5C3F;
  --color-accent: #B8862E;

  --color-text: #1C1A17;
  --color-text-secondary: #5A5347;
  --color-text-muted: #726B5C;

  --color-background: #FFFFFF;
  --color-surface-soft: #F8F6F2;

  --color-border: #E4DED3;
  --color-border-strong: #C9C2B3;

  --color-success: #1F5C3F;
  --color-warning: #B8862E;
  --color-danger: #9B2C2C;
  --color-info: #315A78;

  --font-heading: "Merriweather", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
}
```

------------------------------------------------------------------------

# 21. Component Styling Rule

Components should not contain arbitrary brand values.

Avoid:

``` tsx
style={{
  color: "#7A2A12"
}}
```

Prefer the project's established styling mechanism and shared token:

``` css
color: var(--color-primary);
```

or the equivalent token system already used by the application.

This ensures that changing the theme later does not require editing
dozens of components.

------------------------------------------------------------------------

# 22. Responsive Visual Rules

The design system is responsive, but it does not dictate the
application's mobile information architecture.

Use the current application's responsive structure.

Only apply these visual principles:

### Desktop

-   Comfortable whitespace
-   Full typography scale
-   Full navigation labels
-   Multi-column layouts where the application's UX requires them

### Tablet

-   Reduce spacing
-   Preserve readable typography
-   Allow content to stack when required

### Mobile

-   Reduce horizontal padding
-   Preserve hierarchy
-   Keep controls touch-friendly
-   Avoid text becoming unnecessarily small
-   Use horizontal scrolling for genuinely wide data
-   Never simply squeeze desktop layouts into mobile width

The reference itself switches multi-column sections to a single column
at smaller widths. fileciteturn0file0L151-L156

------------------------------------------------------------------------

# 23. Icons

Use one consistent icon family throughout the project.

Preferred visual style:

-   Simple
-   Line-based
-   Minimal
-   Professional
-   16--20px for standard UI
-   20--24px for prominent actions

Do not mix multiple icon libraries/styles unnecessarily.

Icons should support labels.

Do not make critical functionality understandable only through icons.

------------------------------------------------------------------------

# 24. Motion

Motion should be subtle and functional.

Recommended:

``` text
120–200ms
ease / ease-out
```

Use motion for:

-   Hover
-   Focus
-   Dropdown
-   Dialog
-   Toast
-   Expand/collapse
-   Navigation transitions

Avoid decorative motion.

The reference explicitly disables transitions and smooth scrolling when
reduced motion is requested. fileciteturn0file0L156-L156

Implement:

``` css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

------------------------------------------------------------------------

# 25. Accessibility Visual Rules

The visual system must support accessibility.

Required:

-   Visible keyboard focus
-   Sufficient text contrast
-   Labels for form controls
-   Error states that do not rely only on color
-   Status indicators with text/icons
-   Touch-friendly controls
-   Reduced motion support

Color must never be the only indicator.

Bad:

``` text
●
```

Better:

``` text
● Critical
```

------------------------------------------------------------------------

# 26. Status Components

Status should visually follow the same system.

Example:

``` text
ACTIVE
```

Green.

``` text
PENDING
```

Gold.

``` text
ERROR
```

Danger red.

``` text
DRAFT
```

Neutral.

Use status badges only when a status actually exists in the
application's domain.

Do not invent statuses merely for visual decoration.

------------------------------------------------------------------------

# 27. Data Visualization

The reference does not define a complete charting system.

Therefore charts must follow the project's actual data requirements.

Only inherit the visual language:

-   Restrained colors
-   Maroon as primary series
-   Green as positive/secondary series
-   Gold for attention
-   Neutral gridlines
-   Clear typography
-   Minimal decoration

Do not use all brand colors in every chart.

Use colors semantically.

------------------------------------------------------------------------

# 28. Dark Mode

This reference is fundamentally a light institutional visual system.

Do not automatically introduce dark mode.

If the existing application already supports dark mode, map the design
tokens to dark equivalents without changing component architecture.

The light theme remains the reference visual direction.

------------------------------------------------------------------------

# 29. Branding Usage

The visual identity should communicate institutional credibility.

However:

-   Do not invent government logos.
-   Do not invent official seals.
-   Do not imply government ownership unless the actual project has that
    authorization.
-   Do not copy official branding assets without the project's
    permission/licensing.

The design language may be inspired by the reference without falsely
representing institutional affiliation.

------------------------------------------------------------------------

# 30. What Must NOT Be Copied From Reference

The following are explicitly **not part of this design system**:

-   Reference navigation
-   Reference landing page
-   Reference hero
-   Reference portal tabs
-   Patient/Doctor/Inventory role structure
-   Reference registration form
-   Reference footer structure
-   Reference content/copy
-   Reference page hierarchy
-   Reference HTML
-   Reference JavaScript
-   Reference business rules
-   Reference CTMS workflows

Only the visual concepts should be reused.

------------------------------------------------------------------------

# 31. Design Adaptation Rule

When designing a new screen:

### Step 1

Understand the screen's actual purpose.

### Step 2

Use the existing application's information architecture.

### Step 3

Use existing modular components wherever possible.

### Step 4

Apply this design system's:

-   Typography
-   Colors
-   Spacing
-   Borders
-   Surfaces
-   Focus states
-   Semantic states

### Step 5

Add project-specific UX only when required.

### Step 6

Do a responsive and accessibility check.

This prevents the visual reference from overriding product requirements.

------------------------------------------------------------------------

# 32. Priority Order

When there is a conflict, follow this priority:

``` text
1. Functional requirement
2. Existing application architecture
3. Accessibility
4. Existing project UX conventions
5. This visual design system
6. Decorative visual preference
```

Never break functionality merely to match the reference visually.

------------------------------------------------------------------------

# 33. Final Design Direction

The current application should visually feel like:

> **A modern, trustworthy, institutional clinical/research application
> with a subtle Indian/Ayurveda-inspired identity.**

The reference contributes:

``` text
Maroon
+
Green
+
Gold
+
Warm neutrals
+
Serif institutional headings
+
Sans-serif UI text
+
Thin borders
+
Restrained radius
+
Minimal shadows
+
Subtle motion
```

Everything else must be determined by the actual application's
requirements and modular Next.js architecture.

------------------------------------------------------------------------

# 34. One-Line Rule for Developers / AI Agents

> **Use the reference only as a visual design language; never copy its
> structure, workflow, components, pages, content, or architecture.
> Preserve the existing Next.js application and apply these tokens and
> visual principles to its existing modular components.**
