export const slugify = (input: string): string =>
  input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9._~ -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
