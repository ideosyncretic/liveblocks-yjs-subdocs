import { Button, Group, Select } from "@mantine/core";
import { createId } from "@paralleldrive/cuid2";

import Link from "next/link";
import { useEffect, useState } from "react";

const RoomSwitcher = (props: {
  roomID?: string;
  handleRoomChange: (selectedRoom: string) => void;
}) => {
  const { roomID, handleRoomChange } = props;

  const [newID, setNewID] = useState<string>();

  useEffect(() => {
    const newID = createId();
    setNewID(newID);
  }, []);

  return (
    <Group align="center" flex={1} grow gap="xs" m="md">
      <Select
        placeholder="Switch room..."
        value={roomID}
        data={["my-kanban-board", "my-kanban-board-001", "my-kanban-board-002"]}
        searchable
        nothingFoundMessage="Nothing found..."
        onChange={(value) => handleRoomChange(value ?? "")}
      />
      {newID ? (
        <Button component={Link} href={`/room/${newID}`}>
          New Board
        </Button>
      ) : (
        <Button disabled>New Board</Button>
      )}
    </Group>
  );
};

export default RoomSwitcher;
