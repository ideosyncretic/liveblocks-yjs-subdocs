"use client";

import { AppShell, Group, Title, rem } from "@mantine/core";

export default function GlobalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const HEIGHT = 50;

  return (
    <AppShell header={{ height: HEIGHT, offset: false }} padding="sm">
      <AppShell.Header>
        <Group h="100%" px="sm">
          <Title order={1} size="h5">
            My Prompts
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main pt={`calc(${rem(HEIGHT)} + var(--mantine-spacing-sm))`}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
