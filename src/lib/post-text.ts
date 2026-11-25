// Small facts about a post's text. No server imports: the editor uses them too.

const WORDS_PER_MINUTE = 220;

export function countWords(body: string) {
  return body.trim() ? body.trim().split(/\s+/).length : 0;
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE));
}

export function postDate(date: Date | null) {
  return date?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) ?? "";
}
