import { describe, expect, it } from "vitest";

import { renderTestimonials } from "./testimonials.render.js";
import { TestimonialsSchema } from "./testimonials.schema.js";

describe("TestimonialsSchema", () => {
  it("accepts testimonial cards with optional avatars and attribution", () => {
    const parsed = TestimonialsSchema.parse({
      type: "testimonials",
      title: "What clients notice after a cleaner refresh",
      lead: "Use testimonials when the redesign needs first-person proof.",
      items: [
        {
          quote: "We finally had a site we could send to prospects without apologizing for it.",
          name: "Ari Chen",
          role: "Owner",
          company: "North Harbor Studio",
          image: {
            src: "https://images.example.com/avatars/ari.jpg",
            alt: "Portrait of Ari Chen",
          },
        },
        {
          quote: "The photo layout made our work easier to understand at a glance.",
          name: "Marisol Vega",
          company: "Vega Design Build",
        },
      ],
    });

    const html = renderTestimonials(parsed);

    expect(html).toContain('<section class="c-testimonials">');
    expect(html).toContain("North Harbor Studio");
    expect(html).toContain('class="c-testimonials__avatar"');
  });

  it("rejects unsupported fields on testimonial items", () => {
    const result = TestimonialsSchema.safeParse({
      type: "testimonials",
      title: "What clients notice after a cleaner refresh",
      items: [
        {
          quote: "We finally had a site we could send to prospects without apologizing for it.",
          name: "Ari Chen",
          rating: 5,
        },
      ],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some(
        (issue) =>
          issue.code === "unrecognized_keys" &&
          String(issue.path.join(".")) === "items.0",
      ),
    ).toBe(true);
  });
});
