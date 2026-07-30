export interface MotionEasingToken {
  name: string;
  cssVar: string;
  value: string;
  bezier: [number, number, number, number];
}

export const motionEasing: MotionEasingToken[] = [
  {
    name: "standard",
    cssVar: "--mp-motion-easing-standard",
    value: "cubic-bezier(0.2, 0, 0, 1)",
    bezier: [0.2, 0, 0, 1]
  },
  {
    name: "emphasized",
    cssVar: "--mp-motion-easing-emphasized",
    value: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    bezier: [0.2, 0.8, 0.2, 1]
  },
  {
    name: "exit",
    cssVar: "--mp-motion-easing-exit",
    value: "cubic-bezier(0.4, 0, 1, 1)",
    bezier: [0.4, 0, 1, 1]
  }
];

export const easingMap = Object.fromEntries(motionEasing.map((token) => [token.name, token.bezier])) as Record<
  MotionEasingToken["name"],
  [number, number, number, number]
>;
