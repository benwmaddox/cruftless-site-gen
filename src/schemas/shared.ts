import { z } from "zod";

const bannedHrefSchemePattern = /^(?:javascript|data|vbscript):/iu;

const absoluteWebHrefPatternSource =
  "(?:https?|ftp):\\/\\/[^/?#\\s<>\"`]+(?:[/?#][^\\s<>\"`]*)?";
const mailtoHrefPatternSource = "mailto:[^\\s<>\"`?#]+(?:\\?[^\\s<>\"`]*)?";
const telHrefPatternSource =
  "tel:\\+?[0-9A-Za-z().-]+(?:;[A-Za-z0-9-]+=[^;\\s<>\"`]*)*";
const smsHrefPatternSource = "sms:\\+?[0-9A-Za-z().-]+(?:\\?[^\\s<>\"`]*)?";
const customSchemeHrefPatternSource =
  "(?!(?:(?:https?|ftp|mailto|tel|sms|javascript|data|vbscript):))[a-z][a-z0-9+.-]*:[^\\s<>\"`]+";
const protocolRelativeHrefPatternSource =
  "\\/\\/[^/?#\\s<>\"`]+(?:[/?#][^\\s<>\"`]*)?";
const rootRelativeHrefPatternSource = "\\/(?!\\/)[^\\s<>\"`]*";
const dotRelativeHrefPatternSource = "\\.{1,2}\\/[^\\s<>\"`]*";
const fragmentOrQueryHrefPatternSource = "[#?][^\\s<>\"`]*";
const bareRelativeHrefPatternSource =
  "(?!(?:[a-z][a-z0-9+.-]*:|\\/\\/))[^/?#\\s<>\"`][^\\s<>\"`]*";

const hrefPatternSource = [
  absoluteWebHrefPatternSource,
  mailtoHrefPatternSource,
  telHrefPatternSource,
  smsHrefPatternSource,
  customSchemeHrefPatternSource,
  protocolRelativeHrefPatternSource,
  rootRelativeHrefPatternSource,
  dotRelativeHrefPatternSource,
  fragmentOrQueryHrefPatternSource,
  bareRelativeHrefPatternSource,
].join("|");

const protocolRelativeHrefPattern = new RegExp(`^${protocolRelativeHrefPatternSource}$`, "u");
export const hrefPattern = new RegExp(`^(?:${hrefPatternSource})$`, "iu");

export const explainHrefValidationFailure = (value: string): string | undefined => {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return "provide a non-empty href such as /contact or https://example.com";
  }

  if (trimmedValue !== value) {
    return "remove leading or trailing whitespace";
  }

  if (/[\u0000-\u001F\u007F]/u.test(trimmedValue)) {
    return "remove control characters from the href";
  }

  if (/[<>]/u.test(trimmedValue)) {
    return "use percent-encoding instead of angle brackets";
  }

  if (/\s/u.test(trimmedValue)) {
    return "hrefs cannot contain spaces";
  }

  if (bannedHrefSchemePattern.test(trimmedValue)) {
    return "unsafe schemes like javascript:, data:, and vbscript: are not allowed";
  }

  if (/^(?:https?|ftp):\/\/$/iu.test(trimmedValue)) {
    return "include a host, for example https://example.com/path";
  }

  if (/^mailto:$/iu.test(trimmedValue)) {
    return "include an email address, for example mailto:hello@example.com";
  }

  if (/^tel:$/iu.test(trimmedValue)) {
    return "include a phone number, for example tel:+15555555555";
  }

  if (/^sms:$/iu.test(trimmedValue)) {
    return "include a phone number, for example sms:+15555555555";
  }

  if (/^\/\//u.test(trimmedValue) && !protocolRelativeHrefPattern.test(trimmedValue)) {
    return "protocol-relative hrefs need a host, for example //cdn.example.com/file.js";
  }

  if (!hrefPattern.test(trimmedValue)) {
    return "use /path, relative path, #fragment, ?query, https://..., mailto:..., or tel:...";
  }

  return undefined;
};

export const isValidHref = (value: string): boolean => explainHrefValidationFailure(value) === undefined;

export const HrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(hrefPattern, "href must be a valid href");

export const LinkSchema = z
  .object({
    label: z.string().min(1),
    href: HrefSchema,
  })
  .strict();

export type LinkData = z.infer<typeof LinkSchema>;

export const ImageReferenceSchema = z
  .object({
    src: z.string().min(1).max(2048),
    alt: z.string().min(1).max(200),
    caption: z.string().min(1).max(280).optional(),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
  })
  .strict();

export type ImageReferenceData = z.infer<typeof ImageReferenceSchema>;
