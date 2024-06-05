"use client";

import { Button, Group, Select, Stack } from "@mantine/core";
import { createId } from "@paralleldrive/cuid2";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleRoomChange = (selectedRoom: string) => {
    router.push(`/room/${selectedRoom}`);
  };

  return (
    <Stack m="xs">
      <Group align="center" flex={1} grow gap="xs" m="md">
        <Select
          placeholder="Select room..."
          data={[
            "my-kanban-board",
            "my-kanban-board-001",
            "my-kanban-board-002",
          ]}
          searchable
          nothingFoundMessage="Nothing found..."
          onChange={(value) => handleRoomChange(value ?? "")}
        />
        <Button component={Link} href={`/room/${createId()}`}>
          New Board
        </Button>
      </Group>
    </Stack>
  );
}
