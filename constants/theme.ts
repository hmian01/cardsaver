import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const theme = {
  background: '#101310',
  surface: '#1B201B',
  raised: '#252C24',
  border: '#333B31',
  text: '#F3F4E9',
  muted: '#A6AF9F',
  subtle: '#727F6C',
  accent: '#C9F27D',
  ink: '#1A2811',
  danger: '#FFAAA0',
  warning: '#EDC582',
};
export const cardPalettes = {
  midnight: {
    background: '#253A4C',
    accent: '#54778D',
    text: '#F2F5F7',
    muted: '#BFCDDA',
  },
  sunset: {
    background: '#9D4F36',
    accent: '#DDA47C',
    text: '#FFF4E9',
    muted: '#F1C9B5',
  },
  jade: {
    background: '#304C3B',
    accent: '#92AE70',
    text: '#F0F5DC',
    muted: '#C3D3B6',
  },
  pearl: {
    background: '#D9D7C9',
    accent: '#A9AF9C',
    text: '#2A352D',
    muted: '#536052',
  },
  lilac: {
    background: '#675B80',
    accent: '#B2A1C8',
    text: '#FBF5FF',
    muted: '#E0D2ED',
  },
};
