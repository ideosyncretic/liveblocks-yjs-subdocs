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

  const [fragmentsCreated, setFragmentsCreated] = useState(false);

  // Liveblocks Storage
  const promptVersions = useStorage((root) => root.promptVersions);
  const promptTemplates = useStorage((root) =>
    root.promptVersions.map((v) => v.promptTemplates)
  );

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

  useEffect(() => {
    if (!doc || !provider) return;

    provider.on("sync", (isSynced: boolean) => {
      if (isSynced === true) {
        console.log("Provider is Synced");
      } else {
        console.log("Provider is Not synced");
      }

      const yPromptVersionsMap = doc.getMap("promptVersions");

      const yPromptVersionSubdoc = yPromptVersionsMap.get(
        promptVersions[0].id // TODO: Convert hardcoded version to dynamically-selected version
      ) as Y.Doc | null;

      if (!yPromptVersionSubdoc) {
        console.log("Subdoc doesn't exist yet");
        return;
      }

      const yPromptTemplatesMap =
        yPromptVersionSubdoc.getMap<Y.XmlFragment>("promptTemplates");

      promptVersions.map((promptVersion) => {
        promptVersion.promptTemplates?.map((template) => {
          yPromptTemplatesMap?.observe((event) => {
            console.log(
              "❓ yPromptTemplatesMap?.has(`title_${template.id}`",
              yPromptTemplatesMap?.has(`title_${template.id}`)
            );
            console.log(
              "❓ yPromptTemplatesMap?.has(`description_${template.id}`",
              yPromptTemplatesMap?.has(`title_${template.id}`)
            );

            // if (yPromptTemplatesMap?.has(`title_${template.id}`)) {
            if (
              yPromptTemplatesMap
                ?.toJSON()
                .hasOwnProperty(`title_${template.id}`)
            ) {
              console.log(`Title already exists for ${template.id}`);
            } else {
              // Set a new title fragment
              yPromptTemplatesMap?.set(
                `title_${template.id}`,
                new Y.XmlFragment()
              );
              console.log(
                `➕ Created new title fragment for ${template.id}`,
                yPromptTemplatesMap?.get(`title_${template.id}`)
              );
              console.log("🔥 yPromptTemplatesMap", yPromptTemplatesMap);
              console.log(
                "🔥 yPromptTemplatesMap.size",
                yPromptTemplatesMap.size
              );
              console.log(
                "yPromptTemplatesMap?.has(`title_${template.id}`",
                yPromptTemplatesMap?.has(`title_${template.id}`)
              );
            }

            // if (yPromptTemplatesMap?.has(`description_${template.id}`)) {
            if (
              yPromptTemplatesMap
                ?.toJSON()
                .hasOwnProperty(`description_${template.id}`)
            ) {
              console.log(`Description already exists for ${template.id}`);
            } else {
              // Set a new description fragment
              yPromptTemplatesMap?.set(
                `description_${template.id}`,
                new Y.XmlFragment()
              );
              console.log(
                `➕ Created new description fragment for ${template.id}`,
                yPromptTemplatesMap?.get(`description_${template.id}`)
              );
            }
          });

          // console.log("❓ yPromptTemplatesMap", yPromptTemplatesMap);
          // console.log("❓ yPromptTemplatesMap.size", yPromptTemplatesMap.size);
          // console.log(
          //   "❓ yPromptTemplatesMap?.has(`title_${template.id}`",
          //   yPromptTemplatesMap?.has(`title_${template.id}`)
          // );
          // console.log(
          //   "❓ yPromptTemplatesMap?.get(`title_${template.id}`",
          //   yPromptTemplatesMap?.get(`title_${template.id}`)
          // );
        });

        setFragmentsCreated(true);
      });
    });

    return () => {
      setFragmentsCreated(false);
    };
  }, [doc, provider, promptVersions, synced]);

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

  const yPromptVersionSubdoc = yPromptVersionsMap.get(
    promptVersions[0].id // TODO: Convert hardcoded version to dynamically-selected version
  ) as Y.Doc | null;
  console.log("Rendering subdoc:", yPromptVersionSubdoc?.guid);

  const yPromptTemplatesMap =
    yPromptVersionSubdoc?.getMap<Y.XmlFragment>("promptTemplates");

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
              let titleFragment;
              let descriptionFragment;
              yPromptTemplatesMap?.observe(() => {
                titleFragment = yPromptTemplatesMap?.get(
                  `title_${template.id}`
                );

                descriptionFragment = yPromptTemplatesMap?.get(
                  `description_${template.id}`
                );
              });

              return (
                <Card key={template.id} withBorder>
                  <h5>Template ID: {template.id}</h5>
                  {yPromptVersionSubdoc &&
                    synced &&
                    fragmentsCreated &&
                    yPromptTemplatesMap && (
                      <>
                        <Stack mt="lg" gap={0}>
                          <b>Title</b>
                          {titleFragment && (
                            <Editor
                              fragment={titleFragment}
                              provider={provider}
                              placeholder="Title here"
                            />
                          )}
                        </Stack>
                        <Stack gap={0}>
                          <b>Description</b>
                          {descriptionFragment && (
                            <Editor
                              fragment={descriptionFragment}
                              provider={provider}
                              placeholder="Description here"
                            />
                          )}
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
