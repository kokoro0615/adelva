/**
 * Structured data as a plain script element (the installed Next.js JSON-LD
 * guide). `<` is escaped so no string in the payload can close the element.
 */
export function JsonLd({ data }: { readonly data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
