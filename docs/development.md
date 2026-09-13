# Development notes

## Data compatibility

`@cardsaver/cards` remains an array of card objects. Optional fields include `note`, `frontImage`, `backImage`, `favorite`, `productId`, and `artwork`. Existing variants remain valid; `pearl` and `lilac` are new. Product IDs and artwork preferences also survive version-1 backups; see [card artwork](card-artwork.md). The array order is the wallet order. Storage mutations wait for hydration and are serialized; a failed write does not update the visible snapshot. Failed reads preserve the stored payload and expose a retry action.

The versioned backup format is:

```json
{
  "format": "cardsaver",
  "version": 1,
  "exportedAt": "ISO-8601 timestamp",
  "cards": []
}
```

Legacy arrays are also accepted. Imports validate fields and image data, reject remote/file image references, regenerate card IDs, and skip duplicate card numbers. Importing is additive. Export selection follows wallet order, not the order in which checkboxes were tapped.

Mobile photo references are relative `card-images/<id>.jpg` paths, avoiding stale absolute paths if an iOS app container moves. JPEG/PNG/WebP data URLs are used in backups. New image files are rolled back on a failed save, and deleted/replaced images are removed only if no saved card uses them. Temporary scanner captures, processed photo files, and completed export files are cleaned up.

## Native configuration

`plugins/with-card-scanner.js` selects the OCR module’s Apple Vision implementation on iOS, matching the previous `iosEngine: auto` behavior. It replaces the upstream plugin’s non-idempotent Podfile rewriting. Repeated prebuilds leave the Podfile valid. Android continues to use the OCR module’s Android implementation.

Photo-library/camera purpose strings live in `app.json`. Image picker microphone permission is disabled. Native directories are generated and ignored by Git; do not rely on hand edits to them.

## Validation performed

- TypeScript and ESLint: pass.
- 41 automated tests: pass.
- Production Expo bundles for iOS, Android, and web: pass.
- Xcode Debug build for the iPhone 17 simulator: pass.
- Repeated iOS prebuild and Ruby Podfile syntax check: pass.
- Browser workflows at phone and desktop widths: photo attachment, notes, optional CVV, favorites, search, discard/keep editing, drag reordering, restart persistence, selected export, duplicate preview, deletion, and fresh-wallet restore with embedded photos: pass.
- Browser scanner fallback: pass; no browser runtime exceptions during the workflow checks.
- Card artwork: all 32 designs rendered in the browser; product changes, nickname persistence, custom colors, reloads, product search, and compact artwork in reorder/export passed. The picker was also checked at 320px and the card layout at desktop width.
- iOS app rendered the wallet in the simulator. Full native interactions were not automated; development-client onboarding/system prompts were present.

Before a device release, exercise camera permissions, photo cropping, OCR with physical cards, biometric/passcode cancellation and relocking, and saving/importing a backup through the iOS and Android file providers on real devices. Android native compilation and device flows were not run in this session.

## Useful manual checks

1. Add front and back photos, save, force-close, and reopen the app. Both photos and the note should remain.
2. Change/remove a photo and cancel editing. The saved card should keep its original photo.
3. Export two selected cards with photos; import into a fresh installation. Photos, notes, favorites, colors, and relative order should match. Reimporting should add zero duplicates.
4. Reorder a long wallet by dragging near the screen edge, then save and restart. Repeat using the arrow controls or a screen reader.
5. Enable biometric lock, open an editor or import/export screen, background the app for over a minute, and return. Unlocking should be required without losing an in-progress edit.
6. Deny camera access. Manual entry remains available, and camera access can be enabled from device settings.
