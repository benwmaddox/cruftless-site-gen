import { z } from "zod";

export const hoursDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Holiday",
  "Holidays",
  "Emergency Service",
] as const;

const hoursTimePattern = /^(?:0?[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:AM|PM)$/iu;

export const HoursEntrySchema = z
  .object({
    day: z.enum(hoursDayNames),
    open: z.string().regex(hoursTimePattern, "open must use h:mm AM/PM"),
    close: z.string().regex(hoursTimePattern, "close must use h:mm AM/PM"),
  })
  .strict();

export const HoursSchema = z
  .object({
    type: z.literal("hours"),
    title: z.string().min(1).max(120).optional(),
    entries: z.array(HoursEntrySchema).min(1).max(16),
  })
  .strict();

export type HoursData = z.infer<typeof HoursSchema>;
