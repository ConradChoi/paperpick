import sanitizeHtml from "sanitize-html";

// Public URL prefix for objects in the `product-images` Storage bucket, e.g.
// `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/<path>`.
// Used both to strip <img> tags with a disallowed `src` out of rich-text
// descriptions, and to reject hand-typed/external URLs on the product image
// fields — every product image must come from POST /api/admin/upload.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

function buildProductImagePattern(): RegExp | null {
  if (!SUPABASE_URL) return null;
  const escaped = SUPABASE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escaped}/storage/v1/object/public/product-images/[^\\s"'<>]+$`,
  );
}

const PRODUCT_IMAGE_PATTERN = buildProductImagePattern();

// Exported so the product create/update API can reuse the same allowlist
// for `imageUrl` / `additionalImageUrls`, not just for sanitizing HTML.
export function isProductImageUrl(url: string): boolean {
  if (!PRODUCT_IMAGE_PATTERN) return false;
  return PRODUCT_IMAGE_PATTERN.test(url);
}

const ALLOWED_TAGS = ["p", "br", "b", "strong", "i", "em", "ul", "ol", "li", "img"];

// Descriptions written before the rich-text editor existed are plain text,
// not HTML — e.g. "80g < 90g 비교" or "<1,000매". Running those through
// sanitizeHtml's lenient parser is unsafe: a bare `<` followed by a letter
// that happens to match one of our own allowed tag names (like the "b" in
// "<B급 재고") gets parsed as a real open tag, silently eating the rest of
// the string looking for a close tag and corrupting the visible content.
// So we only ever treat a value as HTML if it contains something that looks
// like one of *our* tags specifically, anchored so a stray "<" in prose
// can't false-positive — anything else is rendered as escaped plain text.
const KNOWN_TAG_PATTERN = new RegExp(`<(${ALLOWED_TAGS.join("|")})(?:[\\s/>]|$)`, "i");

export function looksLikeHtml(value: string): boolean {
  return KNOWN_TAG_PATTERN.test(value);
}

// Safe rendering path for legacy plain-text descriptions: escape HTML
// metacharacters (so the text can never be reinterpreted as markup) and
// turn newlines into <br> so multi-line descriptions still display as
// written. Never pass this output back through sanitizeHtml.
export function escapePlainTextAsHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\n/g, "<br>");
}

// Sanitizes rich-text product descriptions (HTML from the admin editor)
// down to a small allowlist. Called in two places, by design (defense in
// depth): once server-side before INSERT/UPDATE (src/app/api/admin/products),
// and again in fetchProduct() right before the value reaches the public
// page, in case old rows were written before this allowlist existed or the
// DB was edited by hand.
export function sanitizeProductDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      img: ["src", "alt"],
    },
    // No tag we allow needs a scheme-bearing attribute other than img's src,
    // which we validate ourselves below against our own Storage host —
    // tighter than sanitize-html's generic http/https/data allowlist.
    allowedSchemes: ["https"],
    disallowedTagsMode: "discard",
    exclusiveFilter: (frame) => {
      if (frame.tag !== "img") return false;
      const src = frame.attribs.src;
      return !src || !isProductImageUrl(src);
    },
  });
}
