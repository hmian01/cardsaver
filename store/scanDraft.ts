export type ScanDraft = { number: string; expiry?: string; productId?: string };
let draft: ScanDraft | undefined;
export const setScanDraft = (value: typeof draft) => {
  draft = value;
};
export const takeScanDraft = () => {
  const value = draft;
  draft = undefined;
  return value;
};
