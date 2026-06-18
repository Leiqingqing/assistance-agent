export type ThemeTokens = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  accent: string;
  muted: string;
  border: string;
};

export type UiTheme = {
  name: string;
  concept: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export const poeticMeadowTheme = {
  name: "Poetic Meadow",
  concept: "更自然、更温柔的 INFP 草地色，适合社区、内容产品和陪伴型 AI。",
  light: {
    background: "#FBFFF2",
    foreground: "#233019",
    card: "#FFFFFB",
    primary: "#7BAE4F",
    accent: "#F4C7D7",
    muted: "#6C765D",
    border: "#E2EFCB",
  },
  dark: {
    background: "#10170A",
    foreground: "#F7FFE8",
    card: "#1B2511",
    primary: "#B9D982",
    accent: "#F0AFC8",
    muted: "#B2BD9D",
    border: "#354625",
  },
} as const satisfies UiTheme;
