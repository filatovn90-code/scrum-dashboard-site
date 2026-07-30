import type { Meta, StoryObj } from "@storybook/react";
import { fontFamilies, typographyScale } from "@/design-system/tokens/typography";

const meta = {
  title: "Foundations/Typography",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div style={{ padding: "32px", display: "grid", gap: "24px" }}>
      <header style={{ display: "grid", gap: "12px", maxWidth: "780px" }}>
        <span className="mp-type-label" style={{ color: "hsl(var(--mp-color-text-brand))" }}>
          Typography scale
        </span>
        <h1 className="mp-type-h1">Calm, dense, and readable</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          The interface uses {fontFamilies.sans.value}. The scale is tuned for a premium, compact rhythm and should
          stay readable for long Russian headlines and dense productivity copy.
        </p>
      </header>

      <div style={{ display: "grid", gap: "16px" }}>
        {typographyScale.map((token) => (
          <article
            key={token.name}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-surface-default))",
              padding: "24px",
              display: "grid",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <strong className="mp-type-title">{token.name}</strong>
              <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
                {token.cssVarPrefix}-size / -line / -weight / -tracking
              </code>
            </div>
            <div className={token.className}>
              Daily Pulse helps people plan work not only by deadlines, but also by available energy.
            </div>
            <p className="mp-type-body-sm" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
              {token.usage}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
};
