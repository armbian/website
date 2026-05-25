import { sanitizeCmsHtml } from './sanitize';

/**
 * Render a Payload Lexical content node to sanitized HTML. Returns an empty
 * string when the input is missing or not an object (e.g. CMS not seeded yet).
 * The converter is dynamically imported so this code only ships server-side.
 */
export async function renderLexicalContent(content: unknown): Promise<string> {
  if (!content || typeof content !== 'object') return '';
  const { convertLexicalToHTMLAsync, defaultHTMLConvertersAsync } =
    await import('@payloadcms/richtext-lexical/html-async');
  const html = await convertLexicalToHTMLAsync({
    converters: defaultHTMLConvertersAsync,
    // Payload's Lexical field type is not exported in a usable shape; cast here
    // so the 3 callsites don't each need their own `as any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: content as any,
  });
  return sanitizeCmsHtml(html);
}
