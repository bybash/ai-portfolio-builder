// The nav's question word (Who, What, How, When) above a page's plain heading,
// so the page says both what it answers and what it is.
export function PageEyebrow({ word }: { word: string }) {
  return <p className="mb-3 font-heading text-lg font-semibold text-link">{word}</p>;
}
