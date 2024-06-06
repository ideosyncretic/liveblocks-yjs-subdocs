"use client";

import type { BaseUserMeta } from "@liveblocks/core";
import { useEffect, useState } from "react";
import { LiveObject } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import LiveblocksProvider from "@liveblocks/yjs";
import { Stack, Card, Button, Text } from "@mantine/core";

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
  const promptVersions = useStorage((root) => root.promptVersions);

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
    const yPromptVersionsMap = doc.getMap<Y.Doc>("promptVersions");

    provider.on("sync", () => {
      setSynced(true); // Triggers a rerender. Subdocs wouldn't be able to be loaded in time for rendering otherwise

      // Create subdocument for each promptVersion in Liveblocks Storage
      promptVersions?.forEach((promptVersion) => {
        // Init promptVersion subdoc
        const yPromptVersionSubdoc = new Y.Doc();

        if (yPromptVersionsMap.get(promptVersion.id) instanceof Y.Doc) {
          console.log(
            "Subdoc already exists:",
            yPromptVersionsMap.get(promptVersion.id)?.guid
          );
        } else {
          // If the subdoc doesn't exist yet
          yPromptVersionsMap.set(promptVersion.id, yPromptVersionSubdoc); // Add it to the map

          console.log("Subdoc created:", yPromptVersionSubdoc.guid);
        }

        // TODO: Should we take note of GUID in Liveblocks Storage? And then load it based on that reference
        // // Doesn’t seem to work
        // const subdocGuid = yPromptVersionSubdoc.guid;
        // yProvider.loadSubdoc(subdocGuid);

        // NOTE: OR should we just load it based on its reference?
        // Doesn’t seem to work
        // yPromptVersionSubdoc.load();
      });
    });
  }, [promptVersions, doc, provider, room]);

  const addTemplate = useMutation(
    // Mutation context is passed as the first argument
    ({ storage }, versionId: string) => {
      const promptVersions = storage.get("promptVersions");

      const currentVersionIndex = promptVersions.findIndex(
        (version) => version.toObject().id === versionId
      );
      const currentVersion = promptVersions.get(currentVersionIndex);

      const currentTemplates = currentVersion?.get("promptTemplates");

      const newTemplate = new LiveObject({
        id: `template-${createId()}`,
      });

      currentTemplates?.push(newTemplate);
    },
    []
  );

  const deleteTemplate = useMutation(
    // Mutation context is passed as the first argument
    ({ storage }, versionId: string, templateToDeleteId: string) => {
      const promptVersions = storage.get("promptVersions");

      const currentVersionIndex = promptVersions.findIndex(
        (version) => version.toObject().id === versionId
      );
      const currentVersion = promptVersions.get(currentVersionIndex);

      const currentTemplates = currentVersion?.get("promptTemplates");

      const templateToDeleteIndex = currentTemplates?.findIndex(
        (template) => template.toObject().id === templateToDeleteId
      );

      if (typeof templateToDeleteIndex !== "number") {
        return;
      }

      currentTemplates?.delete(templateToDeleteIndex);
    },
    []
  );

  if (!doc || !provider) {
    return null;
  }

  // TODO Wait for subdocs to load and sync
  const yPromptVersionsMap = doc.getMap("promptVersions");
  console.log("yPromptVersionsMap", yPromptVersionsMap);
  const yPromptVersionSubdoc = yPromptVersionsMap.get(
    promptVersions[0].id
  ) as Y.Doc | null;
  console.log("Rendering subdoc:", yPromptVersionSubdoc?.guid);

  return (
    <Stack>
      <Stack gap={0}>
        <Text size="sm" pb="xs">
          Connection status: {status}
        </Text>
        <Text size="sm" pb="xs">
          Sync status: {synced ? "Synced" : "Syncing..."}
        </Text>
      </Stack>
      {promptVersions.map((promptVersion) => {
        return (
          <Stack key={promptVersion.id}>
            <Stack mb="lg">
              <h2>Version ID: {promptVersion.id}</h2>
              <h6>
                <pre>Subdoc GUID: {yPromptVersionSubdoc?.guid}</pre>
              </h6>
            </Stack>
            <Stack gap={0}>
              <h4>Version Title</h4>
              <Editor
                fragment={doc.get("title") as Y.XmlFragment}
                provider={provider}
                placeholder="Title here"
              />
            </Stack>

            <h4>Templates</h4>
            {promptVersion.promptTemplates?.map((template) => {
              return (
                <Card key={template.id} withBorder>
                  <h5>Template ID: {template.id}</h5>
                  {yPromptVersionSubdoc && synced && (
                    <>
                      <Stack mt="lg" gap={0}>
                        <b>Title</b>
                        <Editor
                          fragment={yPromptVersionSubdoc.getXmlFragment(
                            `title_${template.id}`
                          )}
                          provider={provider}
                          placeholder="Title here"
                        />
                      </Stack>
                      <Stack gap={0}>
                        <b>Description</b>
                        <Editor
                          fragment={yPromptVersionSubdoc.getXmlFragment(
                            `description_${template.id}`
                          )}
                          provider={provider}
                          placeholder="Description here"
                        />
                      </Stack>
                    </>
                  )}
                  <Button
                    onClick={() =>
                      deleteTemplate(promptVersion.id, template.id)
                    }
                    variant="filled"
                    color="red">
                    Remove
                  </Button>
                </Card>
              );
            })}

            <Button onClick={() => addTemplate(promptVersion.id)}>
              Add new template
            </Button>
          </Stack>
        );
      })}
    </Stack>
  );
}
