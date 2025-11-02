/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1F6FEB';
const tintColorDark = '#58A6FF';

export const Colors = {
  light: {
    text: '#0B1726',
    background: '#F5F6F8',
    navigation: '#FFFFFF',
    surface: '#FFFFFF',
    borderMuted: '#E1E6EF',
    tint: tintColorLight,
    icon: '#5C6470',
    tabIconDefault: '#7A8696',
    tabIconSelected: tintColorLight,
    accent: '#0F7D7D',
    caution: '#F97316',
  },
  dark: {
    text: '#ECEFF5',
    background: '#07090F',
    navigation: '#0E121D',
    surface: '#141927',
    borderMuted: '#1E2534',
    tint: tintColorDark,
    icon: '#9BA9C0',
    tabIconDefault: '#5F6B80',
    tabIconSelected: tintColorDark,
    accent: '#2CC7C8',
    caution: '#FB923C',
  },
};

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
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
