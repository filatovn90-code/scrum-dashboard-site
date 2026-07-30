export interface ZIndexToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const zIndexTokens: ZIndexToken[] = [
  { name: "base", cssVar: "--mp-z-base", value: "0", usage: "Обычный поток контента." },
  { name: "sticky", cssVar: "--mp-z-sticky", value: "20", usage: "Sticky headers и локальные панели." },
  { name: "dropdown", cssVar: "--mp-z-dropdown", value: "40", usage: "Dropdown, tooltip, popover." },
  { name: "overlay", cssVar: "--mp-z-overlay", value: "60", usage: "Overlay и затемнения." },
  { name: "modal", cssVar: "--mp-z-modal", value: "80", usage: "Модальные окна и критические слои." },
  { name: "toast", cssVar: "--mp-z-toast", value: "100", usage: "Toast-нотификации." }
];
