import type { Meta, StoryObj } from "@storybook/react";
import { radiusTokens } from "@/design-system/tokens/radii";

const meta = {
  title: "Foundations/Radii",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px", maxWidth: "720px" }}>
        <span className="mp-type-label" style={{ color: "hsl(var(--mp-color-text-brand))" }}>
          Calm geometry
        </span>
        <h1 className="mp-type-h1">Border radii</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          Radii stay in the 8-20px range so the UI feels soft and premium without becoming playful or toy-like.
        </p>
      </header>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {radiusTokens.map((token) => (
          <article
            key={token.cssVar}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-surface-default))",
              padding: "24px",
              display: "grid",
              gap: "12px"
            }}
          >
            <strong className="mp-type-title">{token.name}</strong>
            <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
              {token.cssVar} - {token.value}
            </code>
            <div
              aria-hidden="true"
              style={{
                height: "88px",
                borderRadius: `var(${token.cssVar})`,
                border: "1px solid hsl(var(--mp-color-border-default))",
                background: "hsl(var(--mp-color-surface-subtle))"
              }}
            />
            <p className="mp-type-body-sm">{token.usage}</p>
          </article>
        ))}
      </div>
    </div>
  )
};
