export interface SpacingToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const spacingScale: SpacingToken[] = [
  ["0", "--mp-space-0", "0px"],
  ["1", "--mp-space-1", "4px"],
  ["2", "--mp-space-2", "8px"],
  ["3", "--mp-space-3", "12px"],
  ["4", "--mp-space-4", "16px"],
  ["5", "--mp-space-5", "20px"],
  ["6", "--mp-space-6", "24px"],
  ["8", "--mp-space-8", "32px"],
  ["10", "--mp-space-10", "40px"],
  ["12", "--mp-space-12", "48px"],
  ["16", "--mp-space-16", "64px"],
  ["20", "--mp-space-20", "80px"],
  ["24", "--mp-space-24", "96px"],
  ["32", "--mp-space-32", "128px"]
].map(([name, cssVar, value]) => ({
  name,
  cssVar,
  value,
  usage: "Base 4px rhythm for layout spacing and content balance."
}));

export const semanticSpacing: SpacingToken[] = [
  {
    name: "Control Padding X",
    cssVar: "--mp-space-control-padding-x",
    value: "16px",
    usage: "Horizontal padding for buttons, selects, and input controls."
  },
  {
    name: "Control Padding Y",
    cssVar: "--mp-space-control-padding-y",
    value: "12px",
    usage: "Vertical padding for controls with a 44px minimum touch target."
  },
  {
    name: "Card Padding",
    cssVar: "--mp-space-card-padding",
    value: "24px",
    usage: "Default internal spacing for premium cards and panels."
  },
  {
    name: "Section Gap",
    cssVar: "--mp-space-section-gap",
    value: "32px",
    usage: "Rhythm between major sections and large content blocks."
  },
  {
    name: "Page Padding",
    cssVar: "--mp-space-page-padding",
    value: "32px",
    usage: "Primary horizontal padding for desktop page layouts."
  },
  {
    name: "Content Gap",
    cssVar: "--mp-space-content-gap",
    value: "20px",
    usage: "Default gap between adjacent components in a section."
  }
];
