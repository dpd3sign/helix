import { BlurView } from "expo-blur";
import {
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: "default" | "glass";
};

export function ThemedView(
  { style, lightColor, darkColor, variant = "default", ...otherProps }:
    ThemedViewProps,
) {
  const scheme = useColorScheme() ?? "light";

  if (variant === "glass") {
    const glassTokens = Colors[scheme].glass;
    const flattenedStyle = StyleSheet.flatten(style) ?? {};
    const { outerStyle, innerStyle } = splitOuterInnerStyles(flattenedStyle);
    const blurTint = scheme === "dark" ? "dark" : "light";

    return (
      <BlurView
        intensity={40}
        tint={blurTint}
        style={[
          {
            borderRadius: glassTokens.radius,
            overflow: "hidden",
            shadowColor: glassTokens.shadowColor,
            shadowOffset: glassTokens.shadowOffset,
            shadowOpacity: glassTokens.shadowOpacity,
            shadowRadius: glassTokens.shadowRadius,
            elevation: glassTokens.elevation,
          },
          outerStyle,
        ]}
      >
        <View
          {...otherProps}
          style={[
            {
              backgroundColor: glassTokens.bg,
              borderColor: glassTokens.border,
              borderRadius: glassTokens.radius,
              borderWidth: StyleSheet.hairlineWidth * 2,
            },
            innerStyle,
          ]}
        />
      </BlurView>
    );
  }

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

const OUTER_STYLE_KEYS: Array<keyof ViewStyle> = [
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
  "marginVertical",
  "alignSelf",
  "flex",
  "flexBasis",
  "flexGrow",
  "flexShrink",
  "width",
  "minWidth",
  "maxWidth",
  "height",
  "minHeight",
  "maxHeight",
  "top",
  "bottom",
  "left",
  "right",
  "position",
  "rowGap",
  "columnGap",
];

function splitOuterInnerStyles(style: ViewStyle) {
  const outerStyle: ViewStyle = {};
  const innerStyle: ViewStyle = {};

  Object.entries(style).forEach(([key, value]) => {
    if (OUTER_STYLE_KEYS.includes(key as keyof ViewStyle)) {
      outerStyle[key as keyof ViewStyle] = value as never;
    } else {
      innerStyle[key as keyof ViewStyle] = value as never;
    }
  });

  return { outerStyle, innerStyle };
}
