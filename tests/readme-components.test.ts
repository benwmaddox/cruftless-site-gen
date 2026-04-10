import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { componentTypeNames } from "../src/components/index.js";

const readmePath = path.resolve(process.cwd(), "README.md");

const extractReadmeComponentNames = (readmeText: string): string[] => {
  const availableComponentsHeader = "### Available components";
  const availableThemesHeader = "### Available themes";
  const sectionStart = readmeText.indexOf(availableComponentsHeader);
  const sectionEnd = readmeText.indexOf(availableThemesHeader);

  if (sectionStart < 0 || sectionEnd < 0 || sectionEnd <= sectionStart) {
    throw new Error("README component section could not be found");
  }

  return readmeText
    .slice(sectionStart, sectionEnd)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- `") && line.endsWith("`"))
    .map((line) => line.slice(3, -1));
};

describe("README component list", () => {
  it("matches the component registry exactly", async () => {
    const readmeText = await readFile(readmePath, "utf8");

    expect(extractReadmeComponentNames(readmeText)).toEqual(componentTypeNames);
  });
});
