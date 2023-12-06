export function stringToSlug(inputString: string): string {
  let slug = inputString.toLowerCase().trim();
  slug = slug.replace(/\s+/g, "-");
  slug = slug.replace(/[^\w-]+/g, "");

  return slug;
}
