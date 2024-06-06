"use client";

import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "../../../../liveblocks.config";
import { Button, Group, Select, Stack } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
