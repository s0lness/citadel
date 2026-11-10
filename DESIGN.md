# Design

Citadel's visual system. Tokens live in `src/styles.css` (`--ctd-*`, light +
dark via `data-theme` on `<html>`, set by `src/lib/theme-manager.ts`).

## Guiding principle

**"Mostly Mac", or "more Mac than Mac"; never a literal copy of the HIG.**
The HIG isn't enough on its own: decisions need taste, and Citadel is shared
across platforms. 90% Mac is good, 110% Mac is good; 100% is an odd middle
ground. Citadel keeps its own character everywhere: the monochrome ink
palette, the dim on finished books, hold-to-confirm, and its covers.

- **macOS** (desktop app *and* browser): native-leaning components.
- **Windows, Linux, other browsers**: clean, generic versions of the same UI,
  with Citadel's own icon pack.

Reference lineage: Things, Bear, NetNewsWire, Apple Books. Anti-reference:
Calibre's cluttered chrome, generic web-app SaaS.

## Platform-adaptive components

- `src/main.tsx` sets, before first render, `data-platform` on `<html>`
  (`macos`, `windows`, `linux`, `ios`, `android`, `other`, from
  `src/lib/platform/os.ts`) and `data-runtime` (`desktop` | `web`). Components
  read the OS with `usePlatform().os`; CSS adapts with
  `:root[data-platform="macos"] …`. `data-vibrancy` marks the macOS desktop
  window only.
- Prefer tokens that change per platform over per-component branches. Menus
  are the first example: `--ctd-menu-*` gives `ContextMenu` and `Select`'s
  list NSMenu's glass on macOS (blurred translucent material with an opaque
  fallback, 10px panel, 5px inset 22px rows, 13px text, an ink highlight) and
  an opaque panel with a grey highlight elsewhere. Both menus share the same
  highlight, so they always match.
- Never take the system accent colour.

## Color

- Monochrome marble: carved white marble and charcoal ink, drawn from the app
  icon. Stones (`--pal-*`) per theme; every `--ctd-*` token derives from them
  with OKLCH relative colour syntax (see the comment at the top of
  `styles.css`).
- `--ctd-accent` is ink (near-black in light, marble-white in dark), used for
  the default button, current selection, menu highlights and state. Never
  decoration.
- `--ctd-text-link` (macOS's link blue) is only for links in prose.
- Danger is red (`--ctd-danger-ink` for words, `--ctd-danger-bg` for the rare
  fill). Brass (`--ctd-brass`) is the one warm accent, for time and drop
  targets. `--ctd-success` marks a finished book's state, never chrome.
- Layering: `--ctd-bg` (window) → `--ctd-surface*` (content) → controls.
  Sidebar/toolbar share `--ctd-nav-bg`/`--ctd-header-bg` with hairline
  `--ctd-border` separators. No gradients in chrome.
- Book-cover faces (`BookCover.tsx` placeholder art) are content: the serif
  type and spine-shading gradients there are intentional and stay.

## Typography

- System stack everywhere (`--ctd-font-ui`). Headings same family at 600.
  Book titles may use `--ctd-font-serif`; chrome never does.
- Root size 14px; controls, menus and dialog text 13px.
- **No ALL CAPS anywhere**: no `text-transform: uppercase`, no small caps, no
  wide-tracked eyebrow labels. Section headers and card titles are 13px
  semibold in sentence case ("Current Library" is a name, so it keeps its
  capitals). Acronyms (ISBN, EPUB) stay as they are; identifier sources get
  display names ("Open Library", not "OPENLIBRARY",
  `identifierDisplayName` in `src/lib/book-identifiers.ts`).
- **Title case** for menu items, buttons and dialog/sheet titles ("Show
  Details", "Delete 2 Books…", "Save as Shelf"). An item or button that opens
  a dialog ends in "…".

## Controls

- One height for every regular control, `--ctd-control-height`: **24px** on
  desktop-sized screens (web and desktop app), 36px on touch screens
  (`pointer: coarse`). Fields, pop-ups, segmented controls, buttons, icon
  buttons and the search field all line up on one row.
- Buttons: `primary` (filled ink) only for the default button of a form,
  sheet or dialog, the one Return presses; `default` (bordered) for
  everything else; `danger` is bordered with red text and is never the
  default.
- No icon-only buttons unless their meaning is truly obvious; icons must say
  what they do.
- Hold-to-confirm buttons stay for actions that would otherwise need a
  dialog mid-flow.
- Focus ring: monochrome by default (`--ctd-focus-ring`). `data-focus-ring=
  "accent"` on `<html>` swaps in the link blue for comparison (Storybook:
  ui/Focus Ring). Never the system accent colour.

## Sheets and alerts

Follow `docs/adr/0014-in-place-feedback.md` for when to ask at all.

- `AlertDialog` is an NSAlert: a title that names the action ("Delete
  “Middlemarch”?", "Forget “Fiction”?"), a line saying what is and isn't
  affected, and two buttons with the default on the right. Return presses
  the default button wherever focus is; Escape cancels.
- In destructive alerts Cancel is the default (filled) and the destructive
  button is red text. In other alerts the confirm button is the default.
- No "Are you sure…" copy.
- `Sheet` is modal like a native sheet: a click outside does nothing;
  Escape, Cancel or Done close it. Titles in title case.

## Chrome behaves like an app, not a page

- `user-select: none` on the root. Fields, editable text and real content
  opt back in with `.ctd-selectable` / `data-selectable` (book descriptions,
  metadata values, error messages: anything a person would copy).
- ⌘A never selects chrome: it selects all in a field, the block of
  selectable content holding the selection, or whatever the app binds.
- Links and images don't drag out as web content (`-webkit-user-drag:
  none`); something meant to drag says `draggable="true"`.
- The browser's own context menu (Reload, Save Image As…) is blocked except
  in text fields and over selected content (`src/lib/chrome-guards.ts`).
  Right-click menus are `ContextMenu` + `useContextMenu`.
- Cursors follow AppKit: the arrow everywhere, buttons and links included;
  the I-beam in text.

## Scrollbars

Overlay scrollbars that show only while scrolling and never shift content.
On macOS and mobile the system draws them (Citadel adds no
`::-webkit-scrollbar` styling, so macOS's "Show scroll bars" setting is
respected). Elsewhere a thin scrollbar's thumb stays transparent until the
scroller is hovered or scrolling (`data-scrolling`, from
`src/lib/overlay-scrollbars.ts`); scrollers that can grow into overflow add
`.ctd-scroller` to reserve the thin gutter up front.

## Materials (Liquid Glass)

- On macOS the webview is transparent over an `NSVisualEffectView` applied in
  `src-tauri/src/main.rs`. The toolbar + sidebar L-region is real glass.
- `:root[data-vibrancy]` (macOS desktop only) swaps `--ctd-nav-bg`/
  `--ctd-header-bg` to transparent and the page background to transparent.
  Elsewhere the opaque fallbacks apply; never assume transparency exists.
- The native window appearance follows the app theme via `setTheme`
  (`useNativeThemeSync`), so forced-dark Citadel gets dark glass.
- Content floats: pages render inside one opaque panel (`--ctd-content-bg`,
  `--ctd-radius-panel`, hairline border, soft shadow) mounted in
  `__root.tsx`. The panel is the scroll container.
- Glass is structural: the chrome region and transient menus. No other
  blurred or translucent layers inside content.

## Layout

- Inside the content panel: chrome-free lists and grids separated by 1px
  `--ctd-border` hairlines; 20–24px insets at panel edges. Page headers are
  compact control rows, not hero titles.
- Shadows are reserved for overlays (menus, modals, drawers) and book
  covers.

## Motion

- 120–200ms, ease-out, for state changes. `prefers-reduced-motion` is
  honoured globally in `styles.css`.
- Menus appear at once, as on macOS, and fade quickly on dismiss.
- Hover feedback is a background tint on rows and controls. The one hover
  motion is on covers you can open: they lift 2px (`BookCover.tsx`);
  display-only covers (details drawer, edit page) stay still.

## Accessibility

- WCAG AA: `--ctd-ink-soft` is tuned to stay ≥4.5:1 on `--ctd-bg`; keep it
  that way when adjusting. UI components ≥3:1 against adjacent colours.
- Don't communicate state by colour alone (read/unread also uses position or
  iconography; destructive menu items also say so in their words).
