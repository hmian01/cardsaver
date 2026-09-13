# Card product artwork

The shared `CreditCard` uses the same bundled card face in the wallet, details, editor, reorder, and export selection screens. Saved card details use bold white text on dark artwork and bold black text on light artwork, without a stroke, shadow, or background panel. The catalog's `light` flag controls this consistently, including compact previews. The full number remains masked in the wallet; the existing reveal behavior is retained elsewhere.

## Recognition and choices

- The card number detects Visa, Mastercard, American Express, or Discover locally. The app does not send card numbers, photos, or OCR text to a lookup service.
- A supported product name in the card nickname or scanner text selects artwork. Specific variants win over overlapping base names (Venture X over Venture). Ambiguous products and incompatible networks fall back to the existing color design.
- Scanning a front with recognizable product text can create a draft before a number is found. The editor lets you add the number from the back. OCR cannot distinguish finishes or products whose names are absent, such as Gold versus White Gold; use **Change card design** for those cards.
- The searchable picker shows products compatible with the entered network. A chosen product survives nickname changes. **Detect automatically** clears the explicit choice and matches the current name; custom colors retain the product identity.
- Existing cards gain artwork from recognizable names without a migration. Optional `productId` and `artwork` fields survive storage and version-1 backups. Unknown future IDs are retained and rendered with the existing fallback color.

This is local product matching, without Apple Pay provisioning or issuer integration. A number alone does not reliably identify the exact card product.

## Included designs

| Issuer | Products |
| --- | --- |
| Chase | Debit, Business Debit, Freedom Unlimited, Freedom Flex, Sapphire Preferred, Sapphire Reserve, Ink Business Cash, Ink Business Unlimited, Ink Business Preferred, Ink Business Premier, Prime Visa |
| American Express | Gold, White Gold, Platinum, Blue Business Plus, Blue Business Cash |
| Capital One | Debit, Venture, Venture X, VentureOne, Quicksilver, Savor, SavorOne |
| Wells Fargo | Debit, Business Debit |
| Chime | Debit |
| Fidelity | HSA Debit |
| U.S. Bank | Business Debit |
| Bank of America | Atmos Rewards Ascent |
| Associated Bank | Business Debit |
| Citi | AAdvantage Platinum Select |
| SoFi | Debit |

## Artwork provenance

All 32 runtime assets live in [assets/card-art](../assets/card-art). [sources.json](../assets/card-art/sources.json) records each final filename, source URL, and preparation method. No artwork is downloaded while using the wallet, and backup files refer to stable product IDs instead of copying these assets.

Most references come from public issuer product pages. Fidelity HSA and U.S. Bank business debit use published digital artwork from [this card design collection](https://fearthez.com/2022/01/23/card-designs/). These are digital card faces, not customer card photographs.

Where references contained sample personalization, the built-in image generation tool edited the image to remove placeholder names, numbers, expiry, CID, and member-since data while preserving the issuer artwork. Capital One debit was extracted from an issuer photograph. Associated business debit is a landscape adaptation of the silver business card in the issuer's vertical-card photograph. White Gold is a finish adaptation using the cleaned Gold face and the official White Gold swatch, rather than an official flat White Gold asset. These adaptations can differ in small details from the physical card. The manifest distinguishes them from unchanged published artwork and records the prompts or edit summaries.

Generated outputs were copied into the project, resized to a maximum dimension of 960 pixels, and encoded as JPEG at quality 88. The 32 bundled designs total approximately 4.4 MiB. Chime and SoFi use display-time crops declared in [cardArtwork.ts](../constants/cardArtwork.ts). Other faces fill the card canvas. Brand imagery remains the property of its respective owner; the source manifest is provenance, not a license grant.

## Extending and checking

Add a stable product record and specific aliases in `utils/cardProducts.ts`, a bundled asset and its layout metadata in `constants/cardArtwork.ts`, and its provenance in `sources.json`. Avoid broad tier aliases like “Gold,” which can refer to unrelated cards. Test ambiguity, network compatibility, scanner extraction, and backup persistence when changing recognition rules.

Automated coverage includes all requested product aliases, overlapping variants, unsupported products, OCR extraction, selections, custom colors, legacy wallets, future IDs, backups, storage, and search. Physical-card OCR and native keyboard/screen-reader behavior still require device checks.
