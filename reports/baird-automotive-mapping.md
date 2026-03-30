# Baird Automotive mapping notes

Selected theme: `corporate`

Reason: the source site uses a conservative blue-and-white service-business presentation. `corporate` keeps that tone without introducing the heavier stylistic shifts of `studio-industrial`, `brutalism`, `dark-saas`, or `app-announcement`.

Content mapped directly:

- All five public pages in the main navigation were ported into `content/examples/baird-automotive.json`.
- Source page descriptions and canonical URLs were preserved.
- All page-specific content images called out in the visible content areas were preserved as remote image URLs.
- Repeated outbound link groups were preserved with CTA bands so the generated example still exposes the linked destinations.

Source content that did not map cleanly:

- The generator still has no persistent nav, sidebar, or header model. Shared layout components now preserve a repeated contact CTA and shop-details footer, but they do not recreate the original Joomla chrome.
- The Google Maps iframe on the contact page was reduced to Google Maps links. The embedded map itself is not recreated.
- The contact page used JavaScript obfuscation for `joey@bairdautomotive.com`. The generated example uses a normal `mailto:` link instead of reproducing the anti-spam script.
- `Content View Hits` counters were treated as CMS chrome rather than meaningful site content and were not ported.
- The community page contains malformed outbound link markup for the Clarendon commuter link, the Mardi Gras Parade link, and one EX2 Adventures link. The generated example normalizes those links to their apparent intended targets instead of preserving broken source markup.
