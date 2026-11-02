"use client";

import { useEffect, useId, useState } from "react";
import { Stack, Text } from "@zedtech/zedkit-ui";
import { revealOnScrollCopy } from "@/components/demos/i18n/reveal-on-scroll-copy";

export function RevealOnScrollDemo() {
  const id = useId();
  const [state, setState] = useState<"pending" | "in">("pending");
  useEffect(() => {
    const node = document.getElementById(id);
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setState("in");
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [id]);
  return (
    <Stack id={id} data-stagger={state} className="min-w-0">
      {revealOnScrollCopy.tasks.map((task) => (
        <Text key={task}>{task}</Text>
      ))}
    </Stack>
  );
}
