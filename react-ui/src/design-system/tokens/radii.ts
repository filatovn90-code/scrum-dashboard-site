export interface RadiusToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const radiusTokens: RadiusToken[] = [
  {
    name: "sm",
    cssVar: "--mp-radius-sm",
    value: "8px",
    usage: "Малые controls и chips."
  },
  {
    name: "md",
    cssVar: "--mp-radius-md",
    value: "12px",
    usage: "Инпуты и вторичные карточки."
  },
  {
    name: "lg",
    cssVar: "--mp-radius-lg",
    value: "16px",
    usage: "Основные карточки и панели."
  },
  {
    name: "xl",
    cssVar: "--mp-radius-xl",
    value: "20px",
    usage: "Крупные контейнеры и hero-секции."
  },
  {
    name: "pill",
    cssVar: "--mp-radius-pill",
    value: "999px",
    usage: "Только для бейджей, сегментов и focus chips."
  }
];
