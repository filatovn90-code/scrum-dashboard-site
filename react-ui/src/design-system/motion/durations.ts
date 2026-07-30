export interface MotionDurationToken {
  name: string;
  cssVar: string;
  ms: number;
  seconds: number;
}

export const motionDurations: MotionDurationToken[] = [
  { name: "instant", cssVar: "--mp-motion-duration-instant", ms: 0, seconds: 0 },
  { name: "fast", cssVar: "--mp-motion-duration-fast", ms: 120, seconds: 0.12 },
  { name: "normal", cssVar: "--mp-motion-duration-normal", ms: 180, seconds: 0.18 },
  { name: "slow", cssVar: "--mp-motion-duration-slow", ms: 240, seconds: 0.24 }
];

export const durationMap = Object.fromEntries(motionDurations.map((token) => [token.name, token.seconds])) as Record<
  MotionDurationToken["name"],
  number
>;
