import { transform, type Loader } from "esbuild";

const minifyWithEsbuild = async (contents: string, loader: Loader): Promise<string> => {
  const result = await transform(contents, {
    loader,
    legalComments: "none",
    minify: true,
  });

  return result.code.trim();
};

export const minifyCss = (css: string): Promise<string> => minifyWithEsbuild(css, "css");

export const minifyJs = (js: string): Promise<string> => minifyWithEsbuild(js, "js");

const minifyHtmlText = (text: string): string => {
  const collapsedText = text.replaceAll(/\s+/g, " ");

  return collapsedText.trim() ? collapsedText : "";
};

const minifyHtmlMarkup = (html: string): string => {
  const withoutComments = html.replaceAll(/<!--[\s\S]*?-->/g, "");
  const tagPattern = /<[^>]*>/g;
  let minifiedHtml = "";
  let lastIndex = 0;

  for (const tagMatch of withoutComments.matchAll(tagPattern)) {
    const tag = tagMatch[0];
    const index = tagMatch.index ?? 0;
    minifiedHtml += minifyHtmlText(withoutComments.slice(lastIndex, index));
    minifiedHtml += tag.trim();
    lastIndex = index + tag.length;
  }

  minifiedHtml += minifyHtmlText(withoutComments.slice(lastIndex));

  return minifiedHtml;
};

const getAttributeValue = (tag: string, attributeName: string): string | undefined => {
  const attributePattern = new RegExp(
    `\\s${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const attributeMatch = tag.match(attributePattern);

  return attributeMatch?.[1] ?? attributeMatch?.[2] ?? attributeMatch?.[3];
};

const isJavaScriptType = (type: string | undefined): boolean =>
  !type ||
  [
    "application/ecmascript",
    "application/javascript",
    "application/x-ecmascript",
    "application/x-javascript",
    "module",
    "text/ecmascript",
    "text/javascript",
  ].includes(type.trim().toLowerCase());

const minifyRawElementContent = async (
  openingTag: string,
  tagName: string,
  contents: string,
): Promise<string> => {
  if (!contents.trim()) {
    return "";
  }

  if (tagName === "style") {
    return minifyCss(contents);
  }

  if (tagName === "script" && !getAttributeValue(openingTag, "src")) {
    const type = getAttributeValue(openingTag, "type");

    if (isJavaScriptType(type)) {
      return minifyJs(contents);
    }
  }

  return contents.trim();
};

export const minifyHtml = async (html: string): Promise<string> => {
  const rawElementPattern = /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
  let minifiedHtml = "";
  let lastIndex = 0;

  for (const rawElementMatch of html.matchAll(rawElementPattern)) {
    const openingTag = rawElementMatch[1] ?? "";
    const tagName = (rawElementMatch[2] ?? "").toLowerCase();
    const contents = rawElementMatch[3] ?? "";
    const closingTag = rawElementMatch[4] ?? "";
    const index = rawElementMatch.index ?? 0;

    minifiedHtml += minifyHtmlMarkup(html.slice(lastIndex, index));
    minifiedHtml += `${openingTag.trim()}${await minifyRawElementContent(
      openingTag,
      tagName,
      contents,
    )}${closingTag.trim()}`;
    lastIndex = index + rawElementMatch[0].length;
  }

  minifiedHtml += minifyHtmlMarkup(html.slice(lastIndex));

  return minifiedHtml;
};
