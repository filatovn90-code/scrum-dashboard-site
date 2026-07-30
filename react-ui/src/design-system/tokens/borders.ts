export interface BorderToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const borderTokens: BorderToken[] = [
  {
    name: "width / default",
    cssVar: "--mp-border-width-default",
    value: "1px",
    usage: "Базовая граница компонентов и карточек."
  },
  {
    name: "width / strong",
    cssVar: "--mp-border-width-strong",
    value: "1.5px",
    usage: "Выделенные зоны и более активные разделители."
  },
  {
    name: "style / default",
    cssVar: "--mp-border-style-default",
    value: "solid",
    usage: "Основной стиль границ."
  }
];
