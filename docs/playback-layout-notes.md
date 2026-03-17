# Playback Layout Notes

This document captures the current working behavior for Jellyfin playback with Altffour + Media Bar support.

## Goal

- Keep Media Bar on Home routes only.
- Keep native Jellyfin video player + OSD behavior untouched.
- Avoid blank video or hidden video layers during playback route transitions.

## Files

- `Theme/assets/add-ons/media-bar-plugin-support-latest-min.css`
- `Theme/assets/add-ons/media-bar-plugin-support-nightly.css`

## Working Rules

1. Hide Media Bar UI on non-home routes only:
   - `#slides-container`
   - `.bar-loading`
   - `.slide-loading-indicator`
2. Do **not** force custom fullscreen/fixed stacking for:
   - `#videoPlayerContainer`
   - `.videoPlayerContainer`
   - `.videoOsdBottom`
   - `.osdHeader`
3. During playback/video routes, suppress backdrop layers that can paint over video:
   - `.backgroundContainer`
   - `.backgroundContainer.withBackdrop`
   - `.backdropImage`
4. Keep actual video elements explicitly visible:
   - `#videoPlayerContainer video`
   - `.videoPlayerContainer video`
   - `.htmlvideoplayer`

## What Broke Previously

The prior regression came from aggressive playback safety overrides:

- `position: fixed` on video container
- very high forced `z-index`
- pointer-events and OSD/dialog stacking hacks

Those rules caused side effects such as:

- selectors not opening (episode/audio/subtitle/settings),
- mobile tap controls breaking,
- OSD rendering as a detached lower pane,
- blank/background-only playback.

## Safe Edit Guidance

- Prefer route-scoped hides for Media Bar only.
- Avoid changing native Jellyfin player stack context unless absolutely required.
- If playback breaks, first inspect for any new rules targeting:
  - `.videoPlayerContainer`
  - `#videoPlayerContainer`
  - `.videoOsdBottom`
  - `.osdHeader`
  - `.dialogBackdrop`, `.selectionCommandsPanel`, `.actionSheet`

