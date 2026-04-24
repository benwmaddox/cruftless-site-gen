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
const hoursClosedPattern = /^Closed$/u;
const hoursTimeOrClosedPattern = new RegExp(
  `${hoursTimePattern.source.slice(1, -1)}|${hoursClosedPattern.source.slice(1, -1)}`,
  "iu",
);

export const HoursEntrySchema = z
  .object({
    day: z.enum(hoursDayNames),
    open: z.string().regex(hoursTimeOrClosedPattern, "open must use h:mm AM/PM or Closed"),
    close: z.string().regex(hoursTimeOrClosedPattern, "close must use h:mm AM/PM or Closed"),
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
