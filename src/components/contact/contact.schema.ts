import { z } from "zod";

const phoneExtensionPattern = /\s*(?:x|ext\.?)\s*(\d{1,6})$/iu;
const normalizedPhonePattern = /^\+?\d{7,15}$/u;

export const normalizePhoneForTelHref = (phone: string): string | undefined => {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return undefined;
  }

  const extensionMatch = trimmedPhone.match(phoneExtensionPattern);
  const extension = extensionMatch?.[1];
  const numberWithoutExtension = extensionMatch
    ? trimmedPhone.slice(0, extensionMatch.index).trim()
    : trimmedPhone;
  const normalizedNumber = numberWithoutExtension.replaceAll(/[().\-\s]/g, "");

  if (!normalizedPhonePattern.test(normalizedNumber)) {
    return undefined;
  }

  return extension ? `${normalizedNumber};ext=${extension}` : normalizedNumber;
};

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

export const ContactSchema = z
  .object({
    type: z.literal("contact"),
    title: z.string().min(1).max(120).optional(),
    address: z.string().min(1).max(280),
    phone: PhoneNumberSchema.optional(),
    email: z.string().email("email must be a valid email address").max(254).optional(),
  })
  .strict();

export type ContactData = z.infer<typeof ContactSchema>;
