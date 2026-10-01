/**
 * Turns pasted text (one student per line; commas and semicolons also separate) into a clean
 * list of names: trimmed, single-spaced, no blanks, no duplicates (case-insensitive).
 */
export function parseNames(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const part of text.split(/[\r\n;,]+/)) {
    // Drop leading list numbering such as "1." or "12)".
    const name = part
      .replace(/^\s*\d+\s*[.)]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}
