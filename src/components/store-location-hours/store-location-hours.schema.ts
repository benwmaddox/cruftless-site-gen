import { z } from "zod";

import { normalizePhoneForTelHref } from "../contact/contact.schema.js";
import { isGoogleMapsUrl } from "../google-maps/google-maps.schema.js";
import { HoursEntrySchema } from "../hours/hours.schema.js";

const PhoneNumberSchema = z
  .string()
  .min(7)
  .max(40)
  .superRefine((value, ctx) => {
    if (normalizePhoneForTelHref(value)) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "phone must be a valid phone number",
    });
  });

export const StoreLocationHoursSchema = z
  .object({
    type: z.literal("store-location-hours"),
    title: z.string().min(1).max(120).optional(),
    embedUrl: z
      .string()
      .url()
      .max(2048)
      .refine(isGoogleMapsUrl, {
        message: "embedUrl must be an https Google Maps URL under /maps",
      }),
    mapTitle: z.string().min(1).max(120),
    address: z.string().min(1).max(280),
    phone: PhoneNumberSchema.optional(),
    email: z.string().email("email must be a valid email address").max(254).optional(),
    hours: z.array(HoursEntrySchema).min(1).max(16),
  })
  .strict();

export type StoreLocationHoursData = z.infer<typeof StoreLocationHoursSchema>;
