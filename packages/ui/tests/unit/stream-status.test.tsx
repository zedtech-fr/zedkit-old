import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StreamStatus, StreamText, ZedkitUiProvider, zedkitUiMessagesFr } from "#index.js";

afterEach(cleanup);

describe("StreamStatus", () => {
  it("words the named step and announces it politely", () => {
    render(<StreamStatus stage="reading-reference" />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("data-slot")).toBe("stream-status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.textContent).toContain("Reading the site");
    expect(status.innerHTML).toContain("motion-safe:animate-ping");
  });

  it("uses the French catalog for the same step", () => {
    render(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <StreamStatus stage="reading-reference" />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("Lecture du site");
  });

  it("wording for every later step, including the French palette line", () => {
    const { rerender } = render(<StreamStatus stage="picking-palette" />);
    expect(screen.getByRole("status").textContent).toContain("Choosing a palette");
    rerender(
      <ZedkitUiProvider messages={zedkitUiMessagesFr}>
        <StreamStatus stage="picking-palette" />
      </ZedkitUiProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("Choix de la palette");
  });

  it("skips its own live region when a parent already announces", () => {
    render(<StreamStatus stage="picking-typography" live={false} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.querySelector("[data-slot=stream-status]")?.textContent).toContain("Choosing typography");
  });

  it("renders a custom label before the first stage", () => {
    render(<StreamStatus label="Working on it." />);
    expect(screen.getByRole("status").textContent).toContain("Working on it.");
  });
});

describe("StreamText", () => {
  it("announces additions without re-reading the whole string", () => {
    render(<StreamText text="A calm newsroom." />);
    const node = screen.getByRole("status");
    expect(node.getAttribute("data-slot")).toBe("stream-text");
    expect(node.getAttribute("aria-live")).toBe("polite");
    expect(node.getAttribute("aria-atomic")).toBe("false");
    expect(node.textContent).toBe("A calm newsroom.");
  });

  it("renders nothing when the draft is still empty", () => {
    const { container } = render(<StreamText text="" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("[data-slot=stream-text]")).toBeNull();
  });
});
