let draft: { number: string; expiry?: string } | undefined;
export const setScanDraft = (value: typeof draft) => {
  draft = value;
};
export const takeScanDraft = () => {
  const value = draft;
  draft = undefined;
  return value;
};
