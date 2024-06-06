"use client";

import type { BaseUserMeta } from "@liveblocks/core";
import { useEffect, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import LiveblocksProvider from "@liveblocks/yjs";
import { Stack, Card, Button } from "@mantine/core";

import {
  useMutation,
  useRoom,
  useStorage,
  useStatus,
} from "../../../../liveblocks.config";
import * as Y from "yjs";
import { createId } from "@paralleldrive/cuid2";
import Editor from "@/components/Editor.component";

export default function DemoPage() {
  return (
    <ClientSideSuspense fallback="Loading...">
      {() => <App />}
    </ClientSideSuspense>
  );
}

function App() {
  // const doc = useMemo(() => new Y.Doc(), []);
  const room = useRoom();
  const [doc, setDoc] = useState<Y.Doc>();
  const [provider, setProvider] =
    useState<LiveblocksProvider<never, never, BaseUserMeta, never>>();

  const status = useStatus();
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
      yDoc.destroy();
      yProvider.destroy();
    };
  }, [room]);

  useEffect(() => {
    if (!doc || !provider) return;

    // Create a top-level map to store subdocs
    const yListsMap = doc.getMap<Y.Doc>("lists");

    provider.on("sync", () => {
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
  }, [lists, doc, provider, room]);

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
        <p>Connection status: {status}</p>
        <p>Sync status: {synced ? "Synced" : "Syncing..."}</p>
        {lists.map((list) => {
          return (
            <Stack key={list.id}>
              <Stack mb="lg">
                <h2>List ID: {list.id}</h2>
                <pre>Subdoc GUID: {yListSubdoc?.guid}</pre>
              </Stack>
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

              <Button onClick={() => addCard(list.id)}>Add new card</Button>
            </Stack>
          );
        })}
      </Stack>
    </main>
  );
}
