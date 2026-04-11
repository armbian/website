import sanitizeHtml from 'sanitize-html';

export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'pre',
      'code',
      'span',
      'div',
      'figure',
      'figcaption',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      code: ['class'],
      pre: ['class'],
      span: ['class'],
      div: ['class'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      a: ['href', 'target', 'rel'],
    },
    allowedSchemes: ['https', 'mailto'],
  });
}
