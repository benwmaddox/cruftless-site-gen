import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const promptDocPath = path.resolve(process.cwd(), "docs/redesign-one-shot-prompt.md");
const reportPath = path.resolve(process.cwd(), "reports/redesign-prompt-iterations.md");

describe("site redesign prompt docs", () => {
  it("captures the required retention and readiness constraints in the prompt", async () => {
    const promptDoc = await readFile(promptDocPath, "utf8");

    expect(promptDoc).toContain("Preserve every meaningful public page");
    expect(promptDoc).toContain("Preserve all reasonable copy");
    expect(promptDoc).toContain("Preserve important images");
    expect(promptDoc).toContain("image retention ledger");
    expect(promptDoc).toContain("Steelman review before declaring readiness");
    expect(promptDoc).toContain('Only say "ready for customer review"');
    expect(promptDoc).toContain("the work is not ready");
    expect(promptDoc).toContain("gap ledger");
    expect(promptDoc).toContain("exact dates");
  });

  it("records iterative testing against the repo's real example migrations", async () => {
    const report = await readFile(reportPath, "utf8");

    expect(report).toContain("Baird Automotive");
    expect(report).toContain("78th Street Studios");
    expect(report).toContain("## Iteration 1");
    expect(report).toContain("## Iteration 2");
    expect(report).toContain("## Iteration 3");
    expect(report).toContain("High quality");
    expect(report).toContain("steelman audit");
  });
});
