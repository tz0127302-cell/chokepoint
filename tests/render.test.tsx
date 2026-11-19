import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DISCLAIMER } from "../src/lib/disclaimer.js";
import { Layout } from "../src/web/components/Layout.js";
import { DashboardView } from "../src/web/pages/Dashboard.js";
import { MethodologyPage } from "../src/web/pages/Methodology.js";
import { bundledDataset } from "../src/web/bundled.js";

describe("render", () => {
  it("renders the fixture dashboard with a visible disclaimer and Hormuz", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout>
          <DashboardView
            dataset={bundledDataset}
            apiAvailable={false}
            refreshState="idle"
            refreshMessage={null}
            onRefresh={() => undefined}
          />
        </Layout>
      </MemoryRouter>,
    );
    expect(html).toContain(DISCLAIMER);
    expect(html).toContain("Strait of Hormuz");
    expect(html).toContain("Fixture snapshot");
    expect(html).toContain("Bab al-Mandab");
    expect(html).toContain("Not to scale");
    expect(html).toContain("非官方的公开信息整理");
    expect(html).toContain("aria-pressed=\"true\"");
  });

  it("renders methodology, the status rules, and the feed list", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );
    expect(html).toContain("What this is not");
    expect(html).toContain("does not move disrupted to open");
    expect(html).toContain("BBC News");
    expect(html).toContain("GDELT");
    expect(html).toContain("not a ship tracker");
  });
});
