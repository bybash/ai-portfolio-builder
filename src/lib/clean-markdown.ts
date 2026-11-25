// Milkdown writes blank lines as <br />, which the site would show as text.
// Removes those and doubled blank lines, but never touches code blocks.
export function cleanMarkdown(markdown: string) {
  const out: string[] = [];
  let fence: { char: string; length: number } | null = null;
  for (const line of markdown.split("\n")) {
    // A fence may sit inside a quote or a list.
    const marker = line.match(/^[\s>]*(?:(?:[-*+]|\d+[.)])\s+)*(`{3,}|~{3,})(.*)$/);
    if (fence) {
      out.push(line);
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (marker && !(marker[1][0] === "`" && marker[2].includes("`"))) {
      fence = { char: marker[1][0], length: marker[1].length };
      out.push(line);
      continue;
    }
    if (line === "<br />") continue;
    if (line === "" && out.at(-1) === "") continue;
    out.push(line);
  }
  return out.join("\n").replace(/^\n+|\s+$/g, "");
}
