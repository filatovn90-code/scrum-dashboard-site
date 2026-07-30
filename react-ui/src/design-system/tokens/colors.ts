export interface ColorToken {
  name: string;
  cssVar: string;
  swatch: string;
  usage: string;
  note?: string;
}

const swatch = (cssVar: string) => `hsl(var(${cssVar}))`;

export const primitiveColorTokens: ColorToken[] = [
  {
    name: "Warm White 50",
    cssVar: "--mp-color-primitive-warm-white-50",
    swatch: swatch("--mp-color-primitive-warm-white-50"),
    usage: "Основной фон, мягкие поверхности, большие полотна."
  },
  {
    name: "Warm White 100",
    cssVar: "--mp-color-primitive-warm-white-100",
    swatch: swatch("--mp-color-primitive-warm-white-100"),
    usage: "Светлые границы и вторичные фоновые зоны."
  },
  {
    name: "Green 600",
    cssVar: "--mp-color-primitive-green-600",
    swatch: swatch("--mp-color-primitive-green-600"),
    usage: "Основной брендовый акцент и primary action."
  },
  {
    name: "Green 700",
    cssVar: "--mp-color-primitive-green-700",
    swatch: swatch("--mp-color-primitive-green-700"),
    usage: "Hover и активные состояния primary action."
  },
  {
    name: "Graphite 900",
    cssVar: "--mp-color-primitive-graphite-900",
    swatch: swatch("--mp-color-primitive-graphite-900"),
    usage: "Основной текст и плотные заголовки."
  },
  {
    name: "Graphite 500",
    cssVar: "--mp-color-primitive-graphite-500",
    swatch: swatch("--mp-color-primitive-graphite-500"),
    usage: "Вторичный и вспомогательный текст."
  },
  {
    name: "Amber 500",
    cssVar: "--mp-color-primitive-amber-500",
    swatch: swatch("--mp-color-primitive-amber-500"),
    usage: "Повышенная нагрузка, предупреждения, плотный день."
  },
  {
    name: "Red 500",
    cssVar: "--mp-color-primitive-red-500",
    swatch: swatch("--mp-color-primitive-red-500"),
    usage: "Перегруз и мягкие негативные состояния."
  },
  {
    name: "Blue 500",
    cssVar: "--mp-color-primitive-blue-500",
    swatch: swatch("--mp-color-primitive-blue-500"),
    usage: "Информационные состояния и нейтральные сигналы."
  }
];

export const semanticColorTokens: ColorToken[] = [
  {
    name: "Background / Base",
    cssVar: "--mp-color-background-base",
    swatch: swatch("--mp-color-background-base"),
    usage: "Основной фон приложения."
  },
  {
    name: "Background / Subtle",
    cssVar: "--mp-color-background-subtle",
    swatch: swatch("--mp-color-background-subtle"),
    usage: "Вторичные секции и обособленные блоки."
  },
  {
    name: "Background / Tinted",
    cssVar: "--mp-color-background-tinted",
    swatch: swatch("--mp-color-background-tinted"),
    usage: "Мягкая брендовая подложка."
  },
  {
    name: "Surface / Default",
    cssVar: "--mp-color-surface-default",
    swatch: swatch("--mp-color-surface-default"),
    usage: "Основные карточки и контейнеры."
  },
  {
    name: "Surface / Subtle",
    cssVar: "--mp-color-surface-subtle",
    swatch: swatch("--mp-color-surface-subtle"),
    usage: "Инпуты, филды, вспомогательные панели."
  },
  {
    name: "Surface / Elevated",
    cssVar: "--mp-color-surface-elevated",
    swatch: swatch("--mp-color-surface-elevated"),
    usage: "Наверху и над контентом: popover, sticky areas."
  },
  {
    name: "Surface / Brand Soft",
    cssVar: "--mp-color-surface-brand-soft",
    swatch: swatch("--mp-color-surface-brand-soft"),
    usage: "Мягкие брендовые бейджи и панели."
  },
  {
    name: "Text / Primary",
    cssVar: "--mp-color-text-primary",
    swatch: swatch("--mp-color-text-primary"),
    usage: "Главный текст, h1-h3, ключевые значения."
  },
  {
    name: "Text / Secondary",
    cssVar: "--mp-color-text-secondary",
    swatch: swatch("--mp-color-text-secondary"),
    usage: "Описания, body copy, supporting content."
  },
  {
    name: "Text / Tertiary",
    cssVar: "--mp-color-text-tertiary",
    swatch: swatch("--mp-color-text-tertiary"),
    usage: "Подписи, labels, вспомогательные статусы."
  },
  {
    name: "Text / Inverse",
    cssVar: "--mp-color-text-inverse",
    swatch: swatch("--mp-color-text-inverse"),
    usage: "Текст на тёмных и брендовых поверхностях."
  },
  {
    name: "Text / Brand",
    cssVar: "--mp-color-text-brand",
    swatch: swatch("--mp-color-text-brand"),
    usage: "Акцентные заголовки, активные статусы."
  },
  {
    name: "Border / Default",
    cssVar: "--mp-color-border-default",
    swatch: swatch("--mp-color-border-default"),
    usage: "Основные разделители и карточки."
  },
  {
    name: "Border / Subtle",
    cssVar: "--mp-color-border-subtle",
    swatch: swatch("--mp-color-border-subtle"),
    usage: "Почти невидимые внутренние границы."
  },
  {
    name: "Border / Strong",
    cssVar: "--mp-color-border-strong",
    swatch: swatch("--mp-color-border-strong"),
    usage: "Выделенные или сфокусированные области."
  },
  {
    name: "Border / Brand",
    cssVar: "--mp-color-border-brand",
    swatch: swatch("--mp-color-border-brand"),
    usage: "Брендовые рамки и мягкие акценты."
  },
  {
    name: "Action / Primary",
    cssVar: "--mp-color-action-primary",
    swatch: swatch("--mp-color-action-primary"),
    usage: "Основная кнопка и подтверждающие действия."
  },
  {
    name: "Action / Primary Hover",
    cssVar: "--mp-color-action-primary-hover",
    swatch: swatch("--mp-color-action-primary-hover"),
    usage: "Hover для primary action."
  },
  {
    name: "Action / Primary Active",
    cssVar: "--mp-color-action-primary-active",
    swatch: swatch("--mp-color-action-primary-active"),
    usage: "Pressed / active состояние."
  },
  {
    name: "Action / Secondary",
    cssVar: "--mp-color-action-secondary",
    swatch: swatch("--mp-color-action-secondary"),
    usage: "Вторичные кнопки и мягкие фильтры."
  },
  {
    name: "Action / Secondary Hover",
    cssVar: "--mp-color-action-secondary-hover",
    swatch: swatch("--mp-color-action-secondary-hover"),
    usage: "Hover для secondary action."
  },
  {
    name: "Status / Comfortable",
    cssVar: "--mp-color-status-comfortable",
    swatch: swatch("--mp-color-status-comfortable"),
    usage: "Спокойная рабочая нагрузка."
  },
  {
    name: "Status / Comfortable Soft",
    cssVar: "--mp-color-status-comfortable-soft",
    swatch: swatch("--mp-color-status-comfortable-soft"),
    usage: "Мягкая подложка спокойной нагрузки."
  },
  {
    name: "Status / High",
    cssVar: "--mp-color-status-high",
    swatch: swatch("--mp-color-status-high"),
    usage: "Плотный день и повышенная нагрузка."
  },
  {
    name: "Status / High Soft",
    cssVar: "--mp-color-status-high-soft",
    swatch: swatch("--mp-color-status-high-soft"),
    usage: "Мягкая amber-подложка для высокого темпа."
  },
  {
    name: "Status / Overload",
    cssVar: "--mp-color-status-overload",
    swatch: swatch("--mp-color-status-overload"),
    usage: "Сигнал реального перегруза.",
    note: "Использовать вместе с текстом, не полагаться только на цвет."
  },
  {
    name: "Status / Overload Soft",
    cssVar: "--mp-color-status-overload-soft",
    swatch: swatch("--mp-color-status-overload-soft"),
    usage: "Мягкая подложка для перегруза."
  },
  {
    name: "Status / Info",
    cssVar: "--mp-color-status-info",
    swatch: swatch("--mp-color-status-info"),
    usage: "Информационные и нейтральные сигналы."
  },
  {
    name: "Status / Info Soft",
    cssVar: "--mp-color-status-info-soft",
    swatch: swatch("--mp-color-status-info-soft"),
    usage: "Подложка для инфо-состояний."
  },
  {
    name: "Focus / Ring",
    cssVar: "--mp-color-focus-ring",
    swatch: swatch("--mp-color-focus-ring"),
    usage: "Фокус-контур для keyboard navigation."
  }
];

export const loadStateTokens = semanticColorTokens.filter((token) =>
  [
    "--mp-color-status-comfortable",
    "--mp-color-status-comfortable-soft",
    "--mp-color-status-high",
    "--mp-color-status-high-soft",
    "--mp-color-status-overload",
    "--mp-color-status-overload-soft"
  ].includes(token.cssVar)
);
