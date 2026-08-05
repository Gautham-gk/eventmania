NEWFIND — BRAND ASSET PACK
==========================

The finalized mark: thin ring · A2 balanced face · classic smile curve, meeting
at the terracotta connection dot. Wordmark: Lobster Two with corrected N / F
terminals (your edit). Everything here is built from those two masters.

BRAND COLORS
  Deep green   #184E4A   (primary)
  Linen        #F2EFEA   (light / reversed face)
  Terracotta   #E07A5F   (the connection dot — accent only)
  Ink          #1B2624   (near-black, monochrome)
  Dark surface #10211E   (dark-mode tile background)

WHICH FILE DO I USE?
  Vectors (svg/…) are the masters — infinitely scalable, use these wherever you
  can (web, print, app stores that accept SVG, future resizing).
  PNGs (png/…) are ready-made raster exports at standard platform sizes.

------------------------------------------------------------------------
svg/  — VECTOR MASTERS
------------------------------------------------------------------------
  icon/         App-icon tiles, square + rounded, Max fill (~75%)
                  primary (green) · light (white) · dark · black · white
  mark/         The face only, transparent background
                  green · linen · white · ink · black-mono · white-mono
  wordmark/     "NewFind" wordmark, corrected terminals
                  green · linen · white · ink
  lockup/       Icon + wordmark combined
                  horizontal-green · horizontal-linen
                  stacked-green · stacked-linen
  notification/ Single-face status-bar glyph
                  black (mono) · white (mono) · color (terracotta dot)
  avatar/       Circular profile mark (green · light)
  favicon/      Rounded favicon master

------------------------------------------------------------------------
png/  — RASTER EXPORTS
------------------------------------------------------------------------
  app-icon/     Primary: 1024,512,256,192,180,167,152,120,80,64
                + light/dark @ 1024,512,180 · black/white @ 1024,512
                (square, no transparency — iOS/Android round them for you)
  favicon/      16,32,48,64,96,128,192,256,512
                apple-touch-icon-180 · pwa-192 · pwa-512
  mark/         Transparent face, every color @ 256,512,1024
  notification/ black / white / color @ 128,256,512
  avatar/       green @ 200,400,800 · light @ 400,800
  wordmark/     green/linen/white/ink @ heights 120,240,480
  lockup/       horizontal @ h160,h320 · stacked @ h320,h640 (green + linen)
  social/       newfind-og-1200x630  (Open Graph / link-share card)
  splash/       android 1080x1920 · ios 1170x2532  (launch screens)

------------------------------------------------------------------------
LOADING ANIMATION
------------------------------------------------------------------------
  The final loader ("breathing aura") is a CSS/SVG animation, not a still image
  — it lives in the live design file "Newfind Brand Forms.dc.html", section 5.
  Copy the SVG + keyframes from there into your app. Message: "Loading, take a
  deep breath…", ~5s deep breath, eyes blink as the exhale completes.

NOTES
  • OG card + splash taglines are set in a system sans (the brand font could not
    be embedded during raster export). Re-render from /export/render/*.html with
    Bricolage Grotesque loaded if you need the exact brand face on those two.
  • Need a .ico, other sizes, or different crops? Just ask — they regenerate
    from the SVG masters in seconds.
