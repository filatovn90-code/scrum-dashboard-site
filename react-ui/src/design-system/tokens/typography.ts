export interface TypographyToken {
  name: string;
  cssVarPrefix: string;
  className: string;
  usage: string;
}

export const fontFamilies = {
  sans: {
    cssVar: "--mp-font-family-sans",
    value: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  }
};

export const typographyScale: TypographyToken[] = [
  {
    name: "display",
    cssVarPrefix: "--mp-type-display",
    className: "mp-type-display",
    usage: "Landing hero и редкие крупные заголовки."
  },
  {
    name: "h1",
    cssVarPrefix: "--mp-type-h1",
    className: "mp-type-h1",
    usage: "Главный заголовок экранов."
  },
  {
    name: "h2",
    cssVarPrefix: "--mp-type-h2",
    className: "mp-type-h2",
    usage: "Крупные секции и самостоятельные блоки."
  },
  {
    name: "h3",
    cssVarPrefix: "--mp-type-h3",
    className: "mp-type-h3",
    usage: "Карточки, подпредметные секции."
  },
  {
    name: "title",
    cssVarPrefix: "--mp-type-title",
    className: "mp-type-title",
    usage: "Внутренние карточки и строковые title."
  },
  {
    name: "body-lg",
    cssVarPrefix: "--mp-type-body-lg",
    className: "mp-type-body-lg",
    usage: "Плотный описательный copy над fold."
  },
  {
    name: "body",
    cssVarPrefix: "--mp-type-body",
    className: "mp-type-body",
    usage: "Основной текст интерфейса."
  },
  {
    name: "body-sm",
    cssVarPrefix: "--mp-type-body-sm",
    className: "mp-type-body-sm",
    usage: "Уточнения, supporting copy, helper text."
  },
  {
    name: "label",
    cssVarPrefix: "--mp-type-label",
    className: "mp-type-label",
    usage: "Подписи controls и captions внутри cards."
  },
  {
    name: "caption",
    cssVarPrefix: "--mp-type-caption",
    className: "mp-type-caption",
    usage: "Самые маленькие supporting labels."
  },
  {
    name: "metric-lg",
    cssVarPrefix: "--mp-type-metric-lg",
    className: "mp-type-metric-lg",
    usage: "Главные числовые метрики."
  },
  {
    name: "metric-md",
    cssVarPrefix: "--mp-type-metric-md",
    className: "mp-type-metric-md",
    usage: "Вторичные числовые значения."
  }
];
