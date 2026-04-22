import path from "node:path";

export interface SiteTargetPaths {
  root: string;
  contentRoot: string;
  contentPath: string;
  outDir: string;
}

export const resolveSiteTargetPaths = (siteDir: string): SiteTargetPaths => {
  const root = path.resolve(process.cwd(), siteDir);

  return {
    root,
    contentRoot: path.join(root, "content"),
    contentPath: path.join(root, "content", "site.json"),
    outDir: path.join(root, "dist"),
  };
};
