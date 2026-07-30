import type { Meta, StoryObj } from "@storybook/react";
import { shadowTokens } from "@/design-system/tokens/shadows";

const meta = {
  title: "Foundations/Shadows",
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
          Surface separation
        </span>
        <h1 className="mp-type-h1">Shadows</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          Тени почти незаметны. Основное разделение строится на поверхностях и границах, а тень только слегка поддерживает глубину.
        </p>
      </header>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {shadowTokens.map((token) => (
          <article
            key={token.cssVar}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-background-subtle))",
              padding: "24px",
              display: "grid",
              gap: "12px"
            }}
          >
            <strong className="mp-type-title">{token.name}</strong>
            <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
              {token.cssVar}
            </code>
            <div
              aria-hidden="true"
              style={{
                height: "96px",
                borderRadius: "var(--mp-radius-lg)",
                background: "hsl(var(--mp-color-surface-default))",
                border: "1px solid hsl(var(--mp-color-border-subtle))",
                boxShadow: `var(${token.cssVar})`
              }}
            />
            <p className="mp-type-body-sm">{token.usage}</p>
          </article>
        ))}
      </div>
    </div>
  )
};
