"use client";

import { useState } from "react";
import { PromptInput, Stack, Text } from "@zedtech/zedkit-ui";

export function PromptInputDemo() {
  const [text, setText] = useState("");
  const [sent, setSent] = useState("");

  return (
    <Stack gap={2}>
      <PromptInput
        sendLabel="Send"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSubmit={() => {
          setSent(text.trim());
          setText("");
        }}
        placeholder="Ask anything"
        aria-label="Message"
      />
      <Text variant="muted" className="text-sm" aria-live="polite">
        {sent ? `Sent: ${sent}` : "Enter sends, Shift+Enter adds a line."}
      </Text>
    </Stack>
  );
}

export function PromptInputCompleteDemo() {
  const [text, setText] = useState("A calm studio site");
  const [pending, setPending] = useState(false);

  return (
    <Stack gap={2}>
      <PromptInput
        id="prompt-input-complete"
        sendLabel="Send"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onSubmit={() => setPending(true)}
        busy={pending}
        onCancel={() => setPending(false)}
        cancelLabel="Stop"
        rows={1}
        maxLength={2000}
        aria-label="Message"
      />
      <Text variant="muted" className="text-sm" aria-live="polite">
        {pending ? "Waiting for a reply. Stop cancels." : "Send to see the busy state."}
      </Text>
    </Stack>
  );
}
