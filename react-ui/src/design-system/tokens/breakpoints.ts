export interface BreakpointToken {
  name: string;
  cssVar: string;
  value: string;
  usage: string;
}

export const breakpointTokens: BreakpointToken[] = [
  { name: "sm", cssVar: "--mp-breakpoint-sm", value: "640px", usage: "Mobile landscape / compact tablet." },
  { name: "md", cssVar: "--mp-breakpoint-md", value: "768px", usage: "Tablet portrait." },
  { name: "lg", cssVar: "--mp-breakpoint-lg", value: "1024px", usage: "Desktop entry point." },
  { name: "xl", cssVar: "--mp-breakpoint-xl", value: "1280px", usage: "Wide content layouts." },
  { name: "2xl", cssVar: "--mp-breakpoint-2xl", value: "1440px", usage: "Large desktop canvases." }
];
