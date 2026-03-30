import { z } from "zod";

const isGoogleMapsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return false;
    }

    const isGoogleMapsHost =
      url.hostname === "google.com" ||
      url.hostname === "www.google.com" ||
      url.hostname === "maps.google.com";

    return isGoogleMapsHost && url.pathname.startsWith("/maps");
  } catch {
    return false;
  }
};

export const GoogleMapsSchema = z
  .object({
    type: z.literal("google-maps"),
    embedUrl: z
      .string()
      .url()
      .max(2048)
      .refine(isGoogleMapsUrl, {
        message: "embedUrl must be an https Google Maps URL under /maps",
      }),
    title: z.string().min(1).max(120),
    caption: z.string().min(1).max(280).optional(),
    size: z.enum(["content", "wide"]).default("wide"),
  })
  .strict();

export type GoogleMapsData = z.infer<typeof GoogleMapsSchema>;
