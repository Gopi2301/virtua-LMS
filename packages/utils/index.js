import slugify from 'slugify';

export function generateSlug(text) {
  if (!text) return '';
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}
