import type { MotionProps, Transition, Variants } from "framer-motion";
import { durationMap } from "./durations";
import { easingMap } from "./easing";

const collapseTransition: Transition = {
  duration: durationMap.normal,
  ease: easingMap.standard
};

export const fadeIn: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: durationMap.normal, ease: easingMap.standard }
};

export const fadeUp: MotionProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durationMap.normal, ease: easingMap.emphasized }
};

export const scaleIn: MotionProps = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: durationMap.fast, ease: easingMap.standard }
};

export const collapse: Variants = {
  collapsed: { opacity: 0, height: 0, transition: collapseTransition },
  open: { opacity: 1, height: "auto", transition: collapseTransition }
};

export const hoverLift: MotionProps = {
  whileHover: { y: -2, transition: { duration: durationMap.fast, ease: easingMap.standard } },
  whileTap: { y: 0 }
};

export const pulseSoft: MotionProps = {
  animate: {
    opacity: [0.92, 1, 0.92]
  },
  transition: {
    duration: durationMap.slow * 3,
    repeat: Infinity,
    ease: easingMap.standard
  }
};
