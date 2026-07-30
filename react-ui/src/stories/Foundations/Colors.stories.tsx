import type { Meta, StoryObj } from "@storybook/react";
import { loadStateTokens, primitiveColorTokens, semanticColorTokens } from "@/design-system/tokens/colors";

function TokenGrid({
  title,
  description,
  tokens
}: {
  title: string;
  description: string;
  tokens: { name: string; cssVar: string; swatch: string; usage: string; note?: string }[];
}) {
  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <div>
        <h2 className="mp-type-h3">{title}</h2>
        <p className="mp-type-body-sm" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          {description}
        </p>
      </div>
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {tokens.map((token) => (
          <article
            key={token.cssVar}
            style={{
              border: "1px solid hsl(var(--mp-color-border-default))",
              borderRadius: "var(--mp-radius-lg)",
              background: "hsl(var(--mp-color-surface-default))",
              padding: "var(--mp-space-card-padding)",
              boxShadow: "var(--mp-shadow-xs)"
            }}
          >
            <div
              aria-hidden="true"
              style={{
                height: "72px",
                borderRadius: "var(--mp-radius-md)",
                background: token.swatch,
                border: "1px solid hsl(var(--mp-color-border-subtle))"
              }}
            />
            <div style={{ display: "grid", gap: "8px", marginTop: "16px" }}>
              <strong className="mp-type-title">{token.name}</strong>
              <code className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
                {token.cssVar}
              </code>
              <p className="mp-type-body-sm">{token.usage}</p>
              {token.note ? (
                <p className="mp-type-caption" style={{ color: "hsl(var(--mp-color-text-tertiary))" }}>
                  Constraint: {token.note}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const meta = {
  title: "Foundations/Colors",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div style={{ padding: "32px", display: "grid", gap: "40px" }}>
      <header style={{ display: "grid", gap: "12px", maxWidth: "760px" }}>
        <span className="mp-type-label" style={{ color: "hsl(var(--mp-color-text-brand))" }}>
          MindPulse color system
        </span>
        <h1 className="mp-type-h1">Calm productivity palette</h1>
        <p className="mp-type-body-lg" style={{ color: "hsl(var(--mp-color-text-secondary))" }}>
          The palette is built around a deep calm green, warm white, and graphite neutrals. Color should never be the
          only signal of state: pair it with text, icons, or numeric indicators.
        </p>
      </header>

      <TokenGrid
        title="Primitive palette"
        description="Base swatches used to build the semantic system."
        tokens={primitiveColorTokens}
      />

      <TokenGrid
        title="Semantic palette"
        description="Canonical roles for screens, text, actions, and surfaces."
        tokens={semanticColorTokens}
      />

      <TokenGrid
        title="Workload states"
        description="Signals for comfortable, elevated, and overloaded workload states."
        tokens={loadStateTokens}
      />
    </div>
  )
};
