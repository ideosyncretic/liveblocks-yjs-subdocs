"use client";

import type { BaseUserMeta } from "@liveblocks/core";
import { useEffect, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import LiveblocksProvider from "@liveblocks/yjs";
import { Stack, Card, Button } from "@mantine/core";

import {
  RoomProvider,
  useMutation,
  useRoom,
  useStorage,
} from "../../liveblocks.config";
import * as Y from "yjs";
import { createId } from "@paralleldrive/cuid2";
import Editor from "./Editor.component";

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
  const roomID = "my-kanban-board-001";

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

function App() {
  // const doc = useMemo(() => new Y.Doc(), []);
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] =
    useState<LiveblocksProvider<never, never, BaseUserMeta, never>>();

  const [synced, setSynced] = useState(false);

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
    const yListsMap = yDoc.getMap<Y.Doc>("lists");

    yProvider.on("sync", () => {
      setSynced(true); // Triggers a rerender. Subdocs wouldn't be able to be loaded in time for rendering otherwise

      // Create subdocument for each List in Liveblocks Storage
      lists?.forEach((list) => {
        // Init List subdoc
        const yListSubdoc = new Y.Doc();

        if (yListsMap.get(list.id) instanceof Y.Doc) {
          console.log("Subdoc already exists:", yListsMap.get(list.id)?.guid);
        } else {
          // If the subdoc doesn't exist yet
          yListsMap.set(list.id, yListSubdoc); // Add it to the map
          console.log("Subdoc created:", yListSubdoc.guid);
        }

        // TODO: Should we take note of GUID in Liveblocks Storage? And then load it based on that reference
        // // Doesn’t seem to work
        // const subdocGuid = yListSubdoc.guid;
        // yProvider.loadSubdoc(subdocGuid);

        // NOTE: OR should we just load it based on its reference?
        // Doesn’t seem to work
        // yListSubdoc.load();
      });
    });

    // NOTE: This doesn’t work for some reason, doesn’t trigger a load event. Only autoload works. Why?
    // yProvider.loadSubdoc("8b772c15-57a1-49d7-a237-636e1e96a6e8");

    // Listen for changes in subdocs and log their IDs
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
      setSynced(false);
      yDoc?.destroy();
      yProvider?.destroy();
    };
  }, [room, lists]);

  const addCard = useMutation(
    // Mutation context is passed as the first argument
    ({ storage }, listId: string) => {
      const lists = storage.get("lists");
      const currentListIndex = lists.findIndex(
        (value) => value.toObject().id === listId
      );
      const currentList = lists.get(currentListIndex);

      const currentListOfCards = currentList?.get("cards");

      const newCard = new LiveObject({
        id: `card-${createId()}`,
      });

      currentListOfCards?.push(newCard);
    },
    []
  );

  const deleteCard = useMutation(
    // Mutation context is passed as the first argument
    ({ storage }, listId: string, cardToDeleteId: string) => {
      const lists = storage.get("lists");

      const currentListIndex = lists.findIndex(
        (list) => list.toObject().id === listId
      );
      const currentList = lists.get(currentListIndex);

      const currentListOfCards = currentList?.get("cards");

      const cardToDeleteIndex = currentListOfCards?.findIndex(
        (card) => card.toObject().id === cardToDeleteId
      );

      if (typeof cardToDeleteIndex !== "number") {
        return;
      }

      currentListOfCards?.delete(cardToDeleteIndex);
    },
    []
  );

  if (!doc || !provider) {
    return null;
  }

  // TODO Wait for subdocs to load and sync
  const yListsMap = doc.getMap("lists");
  console.log("yListsMap", yListsMap);
  const yListSubdoc = yListsMap.get(lists[0].id) as Y.Doc | null;
  console.log("Rendering subdoc:", yListSubdoc?.guid);

  return (
    <main>
      <Stack mb="xl">
        <pre>Room ID: {room.id}</pre>

        {lists.map((list) => {
          return (
            <Stack key={list.id}>
              <h2>List ID: {list.id}</h2>

              <h5>Subdoc GUID: {yListSubdoc?.guid}</h5>
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
                return (
                  <Card key={card.id} withBorder>
                    <h5>Card ID: {card.id}</h5>
                    {yListSubdoc && (
                      <>
                        <Stack mt="lg" gap={0}>
                          <b>Title</b>
                          <Editor
                            fragment={yListSubdoc.getXmlFragment(
                              `title_${card.id}`
                            )}
                            provider={provider}
                            placeholder="Title here"
                          />
                        </Stack>
                        <Stack gap={0}>
                          <b>Description</b>
                          <Editor
                            fragment={yListSubdoc.getXmlFragment(
                              `description_${card.id}`
                            )}
                            provider={provider}
                            placeholder="Description here"
                          />
                        </Stack>
                      </>
                    )}
                    <Button
                      onClick={() => deleteCard(list.id, card.id)}
                      variant="filled"
                      color="red">
                      Remove
                    </Button>
                  </Card>
                );
              })}

              <Button onClick={() => addCard(list.id)}>Add new</Button>
            </Stack>
          );
        })}
      </Stack>
    </main>
  );
}
