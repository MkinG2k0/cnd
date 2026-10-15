import { Platform } from "react-native";

export const colors = {
  forest: "#193e35",
  forestDeep: "#123128",
  forestHover: "#28594b",
  brass: "#b39b65",
  ink: "#202d28",
  muted: "#68736d",
  pale: "#f3f5f2",
  line: "#dce2dc",
  surface: "#ffffff",
  error: "#a72e20",
  cardBorder: "#e5e9e2",
  founderBg: "#ecf0ea",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontFamily = Platform.select({
  web: "Golos Text, Arial, sans-serif",
  default: undefined,
});
