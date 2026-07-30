export interface ShadowToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const shadowTokens: ShadowToken[] = [
  {
    name: "none",
    cssVar: "--mp-shadow-none",
    value: "none",
    usage: "Flat surfaces where hierarchy is carried by borders and background."
  },
  {
    name: "xs",
    cssVar: "--mp-shadow-xs",
    value: "0 1px 2px rgba(18, 33, 23, 0.04)",
    usage: "Nearly invisible separation for delicate floating layers."
  },
  {
    name: "sm",
    cssVar: "--mp-shadow-sm",
    value: "0 10px 24px rgba(18, 33, 23, 0.05)",
    usage: "Default card and popover depth."
  },
  {
    name: "md",
    cssVar: "--mp-shadow-md",
    value: "0 20px 40px rgba(18, 33, 23, 0.06)",
    usage: "Rare elevated surfaces that need subtle depth."
  },
  {
    name: "focus",
    cssVar: "--mp-shadow-focus",
    value: "0 0 0 4px rgba(50, 93, 67, 0.18)",
    usage: "Accessible keyboard focus ring."
  }
];
