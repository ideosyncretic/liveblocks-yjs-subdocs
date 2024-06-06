"use client";

import RoomSwitcher from "@/components/RoomSwitcher.component";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleRoomChange = (selectedRoom: string) => {
    router.push(`/room/${selectedRoom}`);
  };

  return <RoomSwitcher handleRoomChange={handleRoomChange} />;
}
