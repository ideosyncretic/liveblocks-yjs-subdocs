// Liveblocks example from: https://github.com/liveblocks/liveblocks/blob/main/e2e/next-sandbox/pages/ydoc/subdoc.tsx

"use client";

import type { BaseUserMeta } from "@liveblocks/core";
import LiveblocksProvider from "@liveblocks/yjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { Button, Table } from "@mantine/core";
import { RoomProvider, useRoom } from "../../../liveblocks.config";

function useRenderCount() {
  const ref = React.useRef(0);
  return ++ref.current;
}

export default function Home() {
  const roomId = "code-from-liveblocks";
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{} as never}
      initialStorage={{} as never}>
      <Sandbox />
    </RoomProvider>
  );
}

function Sandbox() {
  const renderCount = useRenderCount();
  const room = useRoom();
  const [subdocContent, setSubdocContent] = useState<Record<string, string>>(
    {}
  );
  const [synced, setSynced] = useState(false);
  const [provider, setProvider] =
    useState<LiveblocksProvider<never, never, BaseUserMeta, never>>();
  const doc = useMemo(() => new Y.Doc(), []);

  const updateSubdocContent = useCallback(() => {
    const docContent: Record<string, string> = {};
    for (const subdoc of doc.getSubdocs()) {
      const guid = subdoc.guid;
      docContent[guid] = subdoc.getText("test").toString();
    }
    setSubdocContent(docContent);
  }, [doc]);

  useEffect(() => {
    if (!room) {
      return;
    }
    const provider = new LiveblocksProvider(room, doc, {
      autoloadSubdocs: false,
    });
    doc.on("subdocs", updateSubdocContent);
    setProvider(provider);
    provider.on("sync", () => {
      setSynced(true);
    });
    return () => {
      setSynced(false);
      doc.off("subdocs", updateSubdocContent);
      provider.destroy();
    };
  }, [doc, room, updateSubdocContent]);

  const clear = () => {
    for (const subdoc of doc.getSubdocs()) {
      const guid = subdoc.guid;
      if (doc.getMap().has(guid)) {
        doc.getMap().delete(guid);
      }
      subdoc.destroy();
    }
    setSubdocContent({});
  };

  const createSubdoc = () => {
    const newDoc = new Y.Doc();
    doc.getMap().set(newDoc.guid, newDoc);
    newDoc.getText("test").insert(0, "test subdoc text");
    updateSubdocContent();
  };

  const loadSubdocs = useCallback(() => {
    for (const subdoc of doc.getSubdocs()) {
      subdoc.load();
      const guid = subdoc.guid;
      const handler = provider?.subdocHandlers.get(guid);
      handler?.once("synced", updateSubdocContent);
    }
  }, [updateSubdocContent, provider, doc]);

  return (
    <div>
      <h3>
        <a href="/">Home</a> › Yjs › Subdocs
      </h3>
      <div style={{ display: "flex", margin: "8px 0" }}>
        <Button id="insert" onClick={createSubdoc}>
          Create Subdoc with Text
        </Button>
        <Button id="load" onClick={loadSubdocs}>
          Load Subdoc with Text
        </Button>
        <Button id="clear" onClick={clear}>
          Clear
        </Button>
      </div>

      <Table>
        <Table.Tbody>
          <Table.Tr id="text">
            <Table.Td>Render count</Table.Td>
            <Table.Td>{renderCount}</Table.Td>
          </Table.Tr>
          <Table.Tr id="text">
            <Table.Td>Subdoc Content</Table.Td>
            <Table.Td>{JSON.stringify(subdocContent)}</Table.Td>
          </Table.Tr>
          <Table.Tr id="sync">
            <Table.Td>Root Doc Synced</Table.Td>
            <Table.Td>{JSON.stringify(synced)}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </div>
  );
}
