import type { Meta, StoryObj } from "@storybook/react";
import { motion } from "framer-motion";
import { durationMap, motionDurations } from "@/design-system/motion/durations";
import { motionEasing } from "@/design-system/motion/easing";
import { fadeIn, fadeUp, hoverLift, pulseSoft, scaleIn } from "@/design-system/motion/presets";

const meta = {
  title: "Foundations/Motion",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px", maxWidth: "760px" }}>
        <span className="mp-type-label" style={{ color: "hsl(var(--mp-color-text-brand))" }}>
          Meaningful motion
        </span>
        <h1 className="mp-type-h1">Motion foundations</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          Motion is only useful where it clarifies interface state: content entering, subtle hover feedback, or
          expanding and collapsing sections.
        </p>
      </header>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {motionDurations.map((token) => (
          <article
            key={token.cssVar}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-surface-default))",
              padding: "24px",
              display: "grid",
              gap: "8px"
            }}
          >
            <strong className="mp-type-title">{token.name}</strong>
            <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
              {token.cssVar}
            </code>
            <p className="mp-type-body-sm">{token.ms} ms</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {motionEasing.map((token) => (
          <article
            key={token.cssVar}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-surface-default))",
              padding: "24px",
              display: "grid",
              gap: "8px"
            }}
          >
            <strong className="mp-type-title">{token.name}</strong>
            <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
              {token.value}
            </code>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <motion.article
          {...fadeIn}
          style={{
            border: "1px solid hsl(var(--mp-color-border-default))",
            borderRadius: "var(--mp-radius-lg)",
            background: "hsl(var(--mp-color-surface-default))",
            padding: "24px"
          }}
        >
          <strong className="mp-type-title">fadeIn</strong>
          <p className="mp-type-body-sm">Use for gentle content and page appearance.</p>
        </motion.article>

        <motion.article
          {...fadeUp}
          style={{
            border: "1px solid hsl(var(--mp-color-border-default))",
            borderRadius: "var(--mp-radius-lg)",
            background: "hsl(var(--mp-color-surface-default))",
            padding: "24px"
          }}
        >
          <strong className="mp-type-title">fadeUp</strong>
          <p className="mp-type-body-sm">Use for cards that need a slight vertical entrance.</p>
        </motion.article>

        <motion.article
          {...scaleIn}
          style={{
            border: "1px solid hsl(var(--mp-color-border-default))",
            borderRadius: "var(--mp-radius-lg)",
            background: "hsl(var(--mp-color-surface-default))",
            padding: "24px"
          }}
        >
          <strong className="mp-type-title">scaleIn</strong>
          <p className="mp-type-body-sm">Use for compact modal-like surfaces.</p>
        </motion.article>

        <motion.article
          {...hoverLift}
          whileHover={{ y: -2, transition: { duration: durationMap.fast } }}
          style={{
            border: "1px solid hsl(var(--mp-color-border-default))",
            borderRadius: "var(--mp-radius-lg)",
            background: "hsl(var(--mp-color-surface-default))",
            padding: "24px"
          }}
        >
          <strong className="mp-type-title">hoverLift</strong>
          <p className="mp-type-body-sm">Only for soft hover feedback without bounce.</p>
        </motion.article>

        <motion.article
          {...pulseSoft}
          style={{
            border: "1px solid hsl(var(--mp-color-border-default))",
            borderRadius: "var(--mp-radius-lg)",
            background: "hsl(var(--mp-color-surface-brand-soft))",
            padding: "24px"
          }}
        >
          <strong className="mp-type-title">pulseSoft</strong>
          <p className="mp-type-body-sm">A rare soft indicator for live status.</p>
        </motion.article>
      </section>
    </div>
  )
};
