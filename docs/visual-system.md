# MindPulse visual system (preview)

MindPulse uses a calm planning workspace with neutral surfaces and restrained green accents. The design borrows the reference's light navigation and clear hierarchy without copying the master-plan application or its behavior.

- Typography: locally hosted Manrope, with system fallback. Font license: `assets/fonts/OFL.txt`.
- Canvas: `#eeeeec`; main surface: `#ffffff`; secondary surface: `#f5f7f2`.
- Text: `#1d2820`; secondary text: `#526055`; structural border: `#dfe4dc`.
- Primary action: `#244e34` with white text; lime is reserved for restrained accents, not small text on white.
- Navigation: light sidebar, muted inactive links and a distinct active state. Preserve visible keyboard focus.
- Components: use shared surface and action tokens; distinguish completed tasks with both text/icon and color.
- Layout: preserve existing functionality and responsive behavior; keep horizontal scrolling within the weekly board.

The preview applies these tokens to the authenticated workspace and aligns the public landing and authentication pages. The daily check-in uses separators instead of nested cards; the weekly summary is compact and responsive; analytics prioritizes weekly insights and provides a single action for an empty dataset. Feedback remains visible but uses a smaller navigation control. Existing application data and business rules are unchanged.
