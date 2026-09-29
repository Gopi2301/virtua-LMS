import slugify from 'slugify';

export function generateSlug(text: string): string {
  if (!text) return '';
  return slugify(text, {
    lower: true,      // convert to lower case
    strict: true,     // strip special characters except replacement
    trim: true,       // trim leading and trailing replacement chars
  });
}