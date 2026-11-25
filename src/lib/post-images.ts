import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

type Node = { type: string; url?: string; alt?: string | null; value?: string; children?: Node[] };

function visitImages(node: Node, visit: (image: Node) => void) {
  if (node.type === "image") visit(node);
  node.children?.forEach((child) => visitImages(child, visit));
}

/** A post's images, in order. */
export function postImages(body: string) {
  const images: { src: string; alt: string }[] = [];
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body) as Node;
  visitImages(tree, (n) => images.push({ src: n.url ?? "", alt: n.alt ?? "" }));
  return images;
}

/** Remark plugin: each image becomes a text marker, numbered as in postImages. */
export function remarkImageMarkers() {
  return (tree: Node) => {
    let count = 0;
    visitImages(tree, (n) => {
      count += 1;
      n.type = "text";
      n.value = `[Image ${count}${n.alt ? `: ${n.alt}` : ""}]`;
    });
  };
}
