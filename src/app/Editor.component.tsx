import { memo } from "react";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Placeholder from "@tiptap/extension-placeholder";

import * as Y from "yjs";

import { EditorContent, useEditor } from "@tiptap/react";
import { useSelf } from "../../liveblocks.config";
import { getRandomColor } from "@/utils/CollaborationUtils";

const Editor = memo(function Editor({
  fragment,
  placeholder,
  provider,
}: {
  fragment: Y.XmlFragment;
  placeholder: string;
  provider: unknown;
}) {
  const userInfo = useSelf((me) => me.info);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      Collaboration.configure({
        fragment: fragment,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: { name: userInfo?.name, color: getRandomColor() },
      }),
    ],
  });

  return (
    <div className="editor">
      <EditorContent editor={editor} />
    </div>
  );
});

export default Editor;
