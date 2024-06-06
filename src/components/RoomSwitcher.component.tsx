import { Button, Group, Select } from "@mantine/core";
import { createId } from "@paralleldrive/cuid2";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RoomSwitcher = (props: { roomID?: string }) => {
  const router = useRouter();
  const { roomID } = props;

  const handleRoomChange = (selectedRoom: string | null) => {
    if (selectedRoom === null) {
      return;
    }
    router.push(`/room/${selectedRoom}`);
  };

  const [newID, setNewID] = useState<string>();

  useEffect(() => {
    const newID = createId();
    setNewID(newID);
  }, []);

  const NEW_BUTTON_TEXT = "New Prompt";

  return (
    <Group align="center" flex={1} grow gap="xs" mb="md">
      <Select
        placeholder="Switch room..."
        data={["my-kanban-board", "my-kanban-board-001", "my-kanban-board-002"]}
        value={roomID ? roomID : ""}
        searchable
        nothingFoundMessage="Nothing found..."
        onChange={(value) => handleRoomChange(value)}
      />
      {newID ? (
        <Button component={Link} href={`/room/${newID}`}>
          {NEW_BUTTON_TEXT}
        </Button>
      ) : (
        <Button disabled>{NEW_BUTTON_TEXT}</Button>
      )}
    </Group>
  );
};

export default RoomSwitcher;
