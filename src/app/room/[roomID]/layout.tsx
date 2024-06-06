"use client";

import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../../../../liveblocks.config";
import { Stack } from "@mantine/core";
import { createId } from "@paralleldrive/cuid2";
import RoomSwitcher from "@/components/RoomSwitcher.component";

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: {
    roomID: string;
  };
}>) {
  const roomID = params.roomID;

  // Card
  const initialTemplate = new LiveObject({
    id: `template-${createId()}`,
  });

  // List
  const initialVersion = new LiveObject({
    id: `version-${createId()}`,
    promptTemplates: new LiveList([initialTemplate]),
  });

  // List
  const initialStorage = {
    promptVersions: new LiveList([initialVersion]),
  };

  return (
    <RoomProvider
      id={roomID}
      initialPresence={{}}
      initialStorage={initialStorage}>
      <Stack>
        <RoomSwitcher roomID={roomID} />
        {children}
      </Stack>
    </RoomProvider>
  );
}
