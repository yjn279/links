# Links Design System

This document describes the Claude Design implementation for the Links app, based on `design-spec/colors_and_type.css` and `design-spec/ui_kits/links-app/`.

## (a) Design Principles

1. **Warm neutral palette** — all surfaces use warm off-whites (`#F8F4EC` paper, `#FEFCF7` card) rather than pure whites. Text uses warm near-blacks (`#1F1A14` ink).
2. **Amber as the single brand accent** — `#F5C518` is the only chromatic CTA color (FAB, brand mark, active nav item, Save button). It reinforces recognition without visual noise.
3. **Liquid Glass for overlay UI** — modals, sidebars, and popovers use `backdrop-filter: saturate(140%) blur(24px)` on web, and `expo-blur BlurView` on native, with a warm-white tint overlay (`rgba(255,252,247,0.88)`).
4. **DM Serif Display for display/heading text** — creates contrast against Inter body copy. Loaded via `@expo-google-fonts/dm-serif-display`.
5. **Responsive two-column grid** — `useWindowDimensions()` switches to a single column on screens narrower than 380 px.

## (b) Tokens

Tokens live in `src/theme/tokens.ts` and are re-exported from `src/theme/index.ts`.

### Colors

| Token | Value | Usage |
|:--|:--|:--|
| `color.amber` | `#F5C518` | Primary CTA, brand mark, active state |
| `color.paper` | `#F8F4EC` | Page background |
| `color.paper2` | `#F2EDE2` | Search pill background, sidebar hover |
| `color.card` | `#FEFCF7` | Card surface |
| `color.ink` | `#1F1A14` | Primary text |
| `color.ink2` | `#4A4238` | Secondary text |
| `color.ink3` | `#837C6F` | Tertiary / labels |
| `color.ink4` | `#B8B0A1` | Hint / placeholder |
| `color.line` | `rgba(31,26,20,0.06)` | Hairline borders |
| `glass.tint` | `rgba(255,252,247,0.72)` | Glass background (normal) |
| `glass.tintStrong` | `rgba(255,252,247,0.88)` | Glass background (sidebar/modal) |
| `glass.border` | `rgba(255,255,255,0.65)` | Glass edge highlight |

### Typography

| Role | Font | Size | Weight |
|:--|:--|:--|:--|
| `display` | DM Serif Display | 56px | 400 |
| `h1` | DM Serif Display | 40px | 400 |
| `h2` | DM Serif Display | 28px | 400 |
| `h3` | Inter | 18px | 600 |
| `stat` | Inter | 44px | 700 |
| `body` | Inter | 15px | 400 |
| `bodySm` | Inter | 13px | 400 |
| `label` | Inter | 11px | 600 (UPPERCASE) |
| `caption` | Inter | 12px | 400 |
| `button` | Inter | 14px | 600 |

Use `getFont(role)` to retrieve the style object, or spread `typeScale[role]` directly.

### Spacing

`sp[1]` = 4px, `sp[2]` = 8px, `sp[3]` = 12px, `sp[4]` = 16px, `sp[5]` = 20px, `sp[6]` = 24px, `sp[7]` = 32px, `sp[8]` = 40px, `sp[9]` = 56px, `sp[10]` = 80px.

### Radius

`radius.xs` = 6, `radius.sm` = 8, `radius.md` = 12, `radius.lg` = 16, `radius.xl` = 20, `radius['2xl']` = 24, `radius['3xl']` = 28, `radius.pill` = 999.

### Elevation

`elevation.e1` (hairline card), `elevation.e2` (floating element), `elevation.e3` (modal/sidebar). These are RN shadow objects.

## (c) Component List

| Component | File | Description |
|:--|:--|:--|
| `Icon` | `components/Icon.tsx` | 20 Lucide-style SVG icons via `react-native-svg` |
| `GlassSurface` | `components/GlassSurface.tsx` | Platform-aware liquid glass container |
| `TopBar` | `components/TopBar.tsx` | Sticky header: hamburger, search pill, amber FAB, bell, avatar |
| `StatCard` | `components/StatCard.tsx` | Horizontal stat card with number + label + delta |
| `ViewToggle` | `components/ViewToggle.tsx` | Grid / List toggle pill |
| `SiteThumb` | `components/SiteThumb.tsx` | Thumbnail with LinearGradient + glow + site pill + star |
| `BookmarkCard` | `components/BookmarkCard.tsx` | Vertical card: thumb + title + desc + tags + time |
| `EmptyLibraryState` | `components/EmptyLibraryState.tsx` | Empty state for 0 results |
| `Sidebar` | `components/Sidebar.tsx` | Animated glass side panel with scrim |
| `AddBookmarkModal` | `components/AddBookmarkModal.tsx` | Glass modal: link mark + URL input + save/cancel |

## (d) Liquid Glass — React Native Implementation

The design-spec calls for `backdrop-filter: saturate(140%) blur(24px)` — a CSS feature not natively supported in React Native.

### Strategy

`GlassSurface` uses a `Platform.OS` branch:

**Web** (`Platform.OS === 'web'`):
```tsx
style={{
  backdropFilter: 'saturate(140%) blur(24px)',
  WebkitBackdropFilter: 'saturate(140%) blur(24px)',
  backgroundColor: glass.tintStrong,
  borderWidth: 1,
  borderColor: glass.border,
}}
```

**Native** (iOS / Android):
```tsx
<View style={{ overflow: 'hidden', borderRadius }}>
  <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: glass.tintStrong }]} />
  <View style={{ position: 'relative', zIndex: 1 }}>{children}</View>
</View>
```

The BlurView provides native Gaussian blur, and the semi-transparent overlay above it adds the warm tint matching `rgba(255,252,247,0.88)`.

### Scrim blurring

Sidebar and modal scrims use `backdrop-filter: blur(8px)` on web. On native, the scrim is a semi-transparent `View` only (`rgba(31,26,20,0.30)`) — adding a second BlurView for the scrim would incur significant rendering cost.

## (e) Migration Notes from Previous Implementation

| Item | Before | After |
|:--|:--|:--|
| Primary color | `#3f51b5` (blue) | `#F5C518` amber |
| Page background | `#fff` | `#F8F4EC` paper |
| Card background | `#fafafa` | `#FEFCF7` card |
| Border color | `#ccc` | `rgba(31,26,20,0.06)` line |
| Error color | `#c0392b` | `color.catDesign` `#B8541C` |
| Button (cancel) | `#eee` | `color.paper2` `#F2EDE2` |
| Main screen | `BookmarkListScreen` with `FlatList` | `LibraryScreen` with `ScrollView` + 2-column grid |
| Bookmark row component | `BookmarkRow.tsx` (row layout) | `BookmarkCard.tsx` (vertical card) — `BookmarkRow` deleted |
| Header | React Navigation header with "Log Out" | `headerShown: false`; new `TopBar` component in-screen |
| Font | System default | DM Serif Display 400 + Inter 400/500/600/700 via `@expo-google-fonts/*` |

## (f) Design Spec References

| Resource | Path |
|:--|:--|
| Color & type tokens | `design-spec/colors_and_type.css` |
| App styles | `design-spec/ui_kits/links-app/styles.css` |
| Icon set (20 icons) | `design-spec/ui_kits/links-app/Icon.jsx` |
| Library view | `design-spec/ui_kits/links-app/LibraryView.jsx` |
| Bookmark card | `design-spec/ui_kits/links-app/BookmarkCard.jsx` |
| Sidebar | `design-spec/ui_kits/links-app/Sidebar.jsx` |
| Add bookmark modal | `design-spec/ui_kits/links-app/AddBookmarkModal.jsx` |
| Top bar | `design-spec/ui_kits/links-app/TopBar.jsx` |
| Stat card | `design-spec/ui_kits/links-app/StatCard.jsx` |
| Static data / collections | `design-spec/ui_kits/links-app/data.js` |
| App shell | `design-spec/ui_kits/links-app/App.jsx` |
