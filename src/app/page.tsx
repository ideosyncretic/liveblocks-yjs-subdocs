"use client";

import type { BaseUserMeta } from "@liveblocks/core";
import { useEffect, useState } from "react";

// import "./styles.css";

import { LiveList, LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import LiveblocksProvider from "@liveblocks/yjs";
import { Stack, Card } from "@mantine/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  RoomProvider,
  useRoom,
  useSelf,
  useStorage,
} from "../../liveblocks.config";
import * as Y from "yjs";

const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];

const getRandomElement = (list: string[]) =>
  list[Math.floor(Math.random() * list.length)];

const getRandomColor = () => getRandomElement(colors);

// Card
const initialCard = new LiveObject({
  id: "card-1",
});

// List
const initialList = new LiveObject({
  id: "list-1",
  cards: new LiveList([initialCard]),
});

// List
const initialStorage = {
  lists: new LiveList([initialList]),
};

export default function DemoPage() {
  const roomID = "my-kanban-board";

  return (
    <RoomProvider
      id={roomID}
      initialPresence={{}}
      initialStorage={initialStorage}>
      <ClientSideSuspense fallback="Loading...">
        {() => <App />}
      </ClientSideSuspense>
    </RoomProvider>
  );
}

const Editor = ({
  fragment,
  placeholder,
  provider,
}: {
  fragment: Y.XmlFragment;
  placeholder: string;
  provider: unknown;
}) => {
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
};

function App() {
  // const doc = useMemo(() => new Y.Doc(), []);
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] =
    useState<LiveblocksProvider<never, never, BaseUserMeta, never>>();

  // Liveblocks Storage
  const lists = useStorage((root) => root.lists);

  useEffect(() => {
    // Initialize Yjs and Liveblocks Provider
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksProvider(room, yDoc, {
      autoloadSubdocs: true,
    });
    setDoc(yDoc);
    setProvider(yProvider);

    // Initialize top-level shared fragment
    yDoc.get("title", Y.XmlFragment);

    // Create a top-level map to store subdocs
    const yListsMap = yDoc.getMap("lists");

    // Create subdocument for each List in Liveblocks Storage
    lists?.forEach((list) => {
      // Init List subdoc
      const yListSubdoc = new Y.Doc();

      yListsMap.set(list.id, yListSubdoc);

      // TODO: Should we take note of GUID in Liveblocks Storage? And then load it based on that reference
      // // Doesn’t seem to work
      // const subdocGuid = yListSubdoc.guid;
      // yProvider.loadSubdoc(subdocGuid);

      // TODO: OR should we just load it based on its reference?
      // Doesn’t seem to work
      // yListSubdoc.load();

      console.log("Subdoc in useEffect:", yListSubdoc.guid);

      // Make fragments for List's Cards
      lists?.forEach((list) => {
        list.cards.forEach((card) => {
          yListSubdoc.get(`title_${card.id}`, Y.XmlFragment);
          yListSubdoc.get(`description_${card.id}`, Y.XmlFragment);
        });
      });
    });

    yDoc.on("subdocs", ({ added, loaded, removed }) => {
      added.forEach((subdoc) => {
        console.log("Added subdoc", subdoc.guid);
      });
      loaded.forEach((subdoc) => {
        console.log("Loaded subdoc", subdoc.guid);
      });
      removed.forEach((subdoc) => {
        console.log("Removed subdoc", subdoc.guid);
      });
    });

    return () => {
      yDoc?.destroy();
      yProvider?.destroy();
    };
  }, [room, lists]);

  if (!doc || !provider) {
    return null;
  }

  return (
    <main>
      <Stack mb="xl">
        <pre>Room ID: {room.id}</pre>

        {lists.map((list) => {
          return (
            <Stack key={list.id}>
              <h2>List ID: {list.id}</h2>

              <Stack gap={0}>
                <h4>List Title</h4>
                <Editor
                  fragment={doc.get("title") as Y.XmlFragment}
                  provider={provider}
                  placeholder="Title here"
                />
              </Stack>

              <h4>Cards</h4>
              {list.cards?.map((card) => {
                const yListsMap = doc.getMap("lists");
                const yListSubdoc = yListsMap.get(lists[0].id) as Y.Doc | null;
                console.log("Rendering subdoc:", yListSubdoc?.guid);

                if (!yListSubdoc) {
                  return null;
                }
                return (
                  <Card key={card.id} withBorder>
                    <h5>Card ID: {card.id}</h5>
                    <Stack mt="lg" gap={0}>
                      <b>Title</b>
                      <Editor
                        fragment={
                          yListSubdoc.get(`title_${card.id}`) as Y.XmlFragment
                        }
                        provider={provider}
                        placeholder="Title here"
                      />
                    </Stack>
                    <Stack gap={0}>
                      <b>Description</b>
                      <Editor
                        fragment={
                          yListSubdoc.get(
                            `description_${card.id}`
                          ) as Y.XmlFragment
                        }
                        provider={provider}
                        placeholder="Description here"
                      />
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          );
        })}
      </Stack>
    </main>
  );
}
