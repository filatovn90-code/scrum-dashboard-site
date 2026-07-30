import type { Meta, StoryObj } from "@storybook/react";
import { semanticSpacing, spacingScale } from "@/design-system/tokens/spacing";

const meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function SpacingBlock({ label, cssVar, value, usage }: { label: string; cssVar: string; value: string; usage: string }) {
  return (
    <article
      style={{
        border: "1px solid hsl(var(--mp-color-border-default))",
        borderRadius: "var(--mp-radius-lg)",
        background: "hsl(var(--mp-color-surface-default))",
        padding: "24px",
        display: "grid",
        gap: "12px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline" }}>
        <strong className="mp-type-title">{label}</strong>
        <span className="mp-type-body-sm" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          {value}
        </span>
      </div>
      <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
        {cssVar}
      </code>
      <div
        aria-hidden="true"
        style={{
          width: value,
          height: "12px",
          borderRadius: "999px",
          background: "hsl(var(--mp-color-action-primary))"
        }}
      />
      <p className="mp-type-body-sm">{usage}</p>
    </article>
  );
}

export const Overview: Story = {
  render: () => (
    <div style={{ padding: "32px", display: "grid", gap: "32px" }}>
      <header style={{ display: "grid", gap: "12px", maxWidth: "720px" }}>
        <span className="mp-type-label" style={{ color: "hsl(var(--mp-color-text-brand))" }}>
          4px rhythm
        </span>
        <h1 className="mp-type-h1">Spacing system</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          Базовая сетка 4px поддерживает ритм и помогает держать интерфейс собранным даже на сложных аналитических экранах.
        </p>
      </header>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {spacingScale.map((token) => (
          <SpacingBlock key={token.cssVar} label={token.name} cssVar={token.cssVar} value={token.value} usage={token.usage} />
        ))}
      </section>

      <section style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {semanticSpacing.map((token) => (
          <SpacingBlock key={token.cssVar} label={token.name} cssVar={token.cssVar} value={token.value} usage={token.usage} />
        ))}
      </section>
    </div>
  )
};
