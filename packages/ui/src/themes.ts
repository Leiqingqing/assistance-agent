export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type ThemeColorGroups = {
  brand: ColorScale & {
    foreground: string;
  };
  surface: {
    page: string;
    card: string;
    popover: string;
    subtle: string;
    raised: string;
  };
  content: {
    title: string;
    body: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
    danger: string;
  };
  state: {
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
    error: string;
    errorForeground: string;
    info: string;
    infoForeground: string;
  };
};

export type SemanticColorTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

export type ShadowTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  glow: string;
  focus: string;
};

export type RadiusTokens = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  full: string;
};

export type TypographyStep = {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
};

export type TypographyTokens = {
  fontFamily: {
    sans: string;
    mono: string;
  };
  weight: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
    black: string;
  };
  scale: {
    caption: TypographyStep;
    body: TypographyStep;
    bodyLarge: TypographyStep;
    title: TypographyStep;
    display: TypographyStep;
  };
};

export type ThemeTokens = SemanticColorTokens & {
  colors: ThemeColorGroups;
  scales: {
    brand: ColorScale;
    meadow: ColorScale;
    blush: ColorScale;
    earth: ColorScale;
  };
  shadows: ShadowTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
};

export type UiTheme = {
  id: string;
  name: string;
  concept: string;
  usage: string;
  constraints: readonly string[];
  light: ThemeTokens;
  dark?: Partial<SemanticColorTokens>;
};

const brandScale = {
  50: "#FBF8FD",
  100: "#F4EEF8",
  200: "#EADFF1",
  300: "#DDCBE8",
  400: "#D4C1E3",
  500: "#CCB6DE",
  600: "#AD91C4",
  700: "#8C6FA4",
  800: "#6D5481",
  900: "#4A3859",
} as const satisfies ColorScale;

const meadowScale = {
  50: "#FBFFF2",
  100: "#F4F9DF",
  200: "#E6F0BD",
  300: "#D4E590",
  400: "#BED66B",
  500: "#9EBC4F",
  600: "#7D993C",
  700: "#5F752F",
  800: "#465724",
  900: "#303B1A",
} as const satisfies ColorScale;

const blushScale = {
  50: "#FFF8FA",
  100: "#FCEEF3",
  200: "#F6D6DF",
  300: "#EFB9C8",
  400: "#E592AA",
  500: "#D46D8D",
  600: "#B85273",
  700: "#933F5A",
  800: "#6D3145",
  900: "#4A2533",
} as const satisfies ColorScale;

const earthScale = {
  50: "#FAF7F1",
  100: "#EFE7D8",
  200: "#DDCDB3",
  300: "#C6AE88",
  400: "#A98C62",
  500: "#886B45",
  600: "#6B5338",
  700: "#51402F",
  800: "#3B3025",
  900: "#29221B",
} as const satisfies ColorScale;

const lightColorGroups = {
  brand: {
    ...brandScale,
    foreground: "#2F2438",
  },
  surface: {
    page: "#FBFFF2",
    card: "#FFFFFB",
    popover: "#FFFFFB",
    subtle: "#F5EEF1",
    raised: "#FFF8FA",
  },
  content: {
    title: "#332631",
    body: "#4A3848",
    secondary: "#746371",
    disabled: "#B8AAB5",
    inverse: "#FFF8F4",
  },
  border: {
    subtle: "#F2E8F0",
    default: "#EADCE8",
    strong: "#D9C2D5",
    focus: "#CCB6DE",
    danger: "#D86972",
  },
  state: {
    success: "#9EBC4F",
    successForeground: "#283416",
    warning: "#D8A84E",
    warningForeground: "#3F2E0E",
    error: "#D86972",
    errorForeground: "#FFF8F4",
    info: "#8C6FA4",
    infoForeground: "#FBF8FD",
  },
} as const satisfies ThemeColorGroups;

const radiusTokens = {
  xs: "0.375rem",
  sm: "0.5rem",
  md: "0.625rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.75rem",
  full: "9999px",
} as const satisfies RadiusTokens;

const typographyTokens = {
  fontFamily: {
    sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
  },
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    black: "900",
  },
  scale: {
    caption: {
      fontSize: "0.75rem",
      lineHeight: "1rem",
      letterSpacing: "0.02em",
      fontWeight: "500",
    },
    body: {
      fontSize: "0.875rem",
      lineHeight: "1.5rem",
      letterSpacing: "0",
      fontWeight: "400",
    },
    bodyLarge: {
      fontSize: "1rem",
      lineHeight: "1.75rem",
      letterSpacing: "-0.01em",
      fontWeight: "400",
    },
    title: {
      fontSize: "1.5rem",
      lineHeight: "2rem",
      letterSpacing: "-0.035em",
      fontWeight: "700",
    },
    display: {
      fontSize: "3rem",
      lineHeight: "1",
      letterSpacing: "-0.055em",
      fontWeight: "900",
    },
  },
} as const satisfies TypographyTokens;

export const poeticMeadowTheme = {
  id: "primrose-companion",
  name: "Primrose Companion",
  concept: "强化粉紫与樱草粉的情绪价值，整体更亲密、更适合陪伴体验。",
  usage: "适合聊天、社区个人主页、情绪记录和更偏情感化的产品场景。",
  constraints: [
    "品牌色只服务于关键动作和关键状态，不拿来铺大面积背景。",
    "状态色只表达反馈和风险，不承担普通强调职责。",
    "深色层级主要靠亮度差和描边，少依赖高透明度白色叠加。",
  ],
  light: {
    background: lightColorGroups.surface.page,
    foreground: lightColorGroups.content.title,
    card: lightColorGroups.surface.card,
    cardForeground: lightColorGroups.content.title,
    popover: lightColorGroups.surface.popover,
    popoverForeground: lightColorGroups.content.title,
    primary: lightColorGroups.brand[500],
    primaryForeground: lightColorGroups.brand.foreground,
    secondary: blushScale[200],
    secondaryForeground: blushScale[900],
    accent: meadowScale[200],
    accentForeground: meadowScale[900],
    muted: lightColorGroups.surface.subtle,
    mutedForeground: lightColorGroups.content.secondary,
    destructive: lightColorGroups.state.error,
    destructiveForeground: lightColorGroups.state.errorForeground,
    border: lightColorGroups.border.default,
    input: lightColorGroups.border.strong,
    ring: lightColorGroups.border.focus,
    colors: lightColorGroups,
    scales: {
      brand: brandScale,
      meadow: meadowScale,
      blush: blushScale,
      earth: earthScale,
    },
    shadows: {
      xs: "0 1px 2px rgb(51 38 49 / 0.05)",
      sm: "0 5px 15px rgb(51 38 49 / 0.07)",
      md: "0 14px 34px rgb(51 38 49 / 0.10)",
      lg: "0 26px 62px rgb(51 38 49 / 0.13)",
      glow: "0 0 0 6px rgb(246 214 223 / 0.26)",
      focus: "0 0 0 3px rgb(204 182 222 / 0.46)",
    },
    radius: radiusTokens,
    typography: typographyTokens,
  },
  dark: {
    background: "#10170A",
    foreground: "#F7FFE8",
    card: "#1B2511",
    cardForeground: "#F7FFE8",
    popover: "#1B2511",
    popoverForeground: "#F7FFE8",
    primary: "#B9D982",
    primaryForeground: "#10170A",
    secondary: "#354625",
    secondaryForeground: "#F7FFE8",
    accent: "#F0AFC8",
    accentForeground: "#10170A",
    muted: "#B2BD9D",
    mutedForeground: "#B2BD9D",
    destructive: "#F08C8C",
    destructiveForeground: "#10170A",
    border: "#354625",
    input: "#445931",
    ring: "#B9D982",
  },
} as const satisfies UiTheme;

export const poeticMeadowThemeOptions = [poeticMeadowTheme] as const;
