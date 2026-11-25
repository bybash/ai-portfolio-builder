import { Plugin } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";

import { youtubeId } from "@/lib/youtube";

// Shows a video's thumbnail under a paragraph that is only a YouTube address,
// where the published page shows the player. The text itself is unchanged.
export const youtubePreview = $prose(
  () =>
    new Plugin({
      props: {
        decorations(state) {
          const found: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (node.type.name !== "paragraph") return true;
            const id = youtubeId(node.textContent);
            if (id) {
              found.push(
                Decoration.widget(
                  pos + node.nodeSize,
                  () => {
                    const box = document.createElement("div");
                    box.className = "youtube-preview";
                    box.contentEditable = "false";
                    const image = document.createElement("img");
                    image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
                    image.alt = "YouTube video";
                    box.append(image);
                    return box;
                  },
                  { key: `youtube-${id}`, side: -1 },
                ),
              );
            }
            return false;
          });
          return DecorationSet.create(state.doc, found);
        },
      },
    }),
);
