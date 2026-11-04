import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  BriefSpecimen,
  CommerceSpecimen,
  EditorialSpecimen,
  SaasDashboardSpecimen,
  ServiceBookingSpecimen,
  selectSpecimenDomain,
  specimenMessagesEn,
} from "#marketing/index.js";

describe("BriefSpecimen", () => {
  it.each([
    ["Online store checkout", "commerce-specimen", "commerce"],
    ["Independent newsroom magazine", "editorial-specimen", "editorial"],
    ["Hair salon appointment", "service-booking-specimen", "service-booking"],
    ["Plain quarterly roadmap", "saas-dashboard-specimen", "saas-dashboard"],
  ] as const)("routes %j to %s", (brief, slot, domainAttr) => {
    const { container } = render(<BriefSpecimen brief={brief} />);
    expect(container.querySelector("[data-slot='brief-specimen']")).toBeTruthy();
    const inner = container.querySelector(`[data-slot='${slot}']`);
    expect(inner?.getAttribute("data-specimen-domain")).toBe(domainAttr);
  });

  it.each([
    ["commerce", "commerce-specimen"],
    ["editorial", "editorial-specimen"],
    ["service-booking", "service-booking-specimen"],
    ["saas-dashboard", "saas-dashboard-specimen"],
  ] as const)("domain override %s renders %s", (domain, slot) => {
    const { container } = render(<BriefSpecimen brief="Hair salon booking" domain={domain} />);
    expect(container.querySelector(`[data-slot='${slot}']`)).toBeTruthy();
  });

  it("passes className to the routed specimen", () => {
    const { container } = render(<BriefSpecimen brief="shop" domain="commerce" className="mt-4" />);
    expect(container.querySelector("[data-slot='commerce-specimen']")?.className).toContain("mt-4");
  });

  it("falls back to saas-dashboard when the brief has no domain keywords", () => {
    const { container } = render(<BriefSpecimen brief="Acme brand refresh" />);
    expect(container.querySelector("[data-slot='saas-dashboard-specimen']")).toBeTruthy();
    expect(selectSpecimenDomain("Acme brand refresh")).toBe("saas-dashboard");
  });
});

describe("CommerceSpecimen", () => {
  it("renders the catalog and saves inventory edits for the selected product", async () => {
    const user = userEvent.setup();
    render(<CommerceSpecimen />);
    expect(screen.getByRole("heading", { name: specimenMessagesEn.commerce.heading })).toBeTruthy();
    const list = screen.getByRole("list", { name: specimenMessagesEn.commerce.listAriaLabel });
    await user.click(within(list).getByRole("button", { name: /Glazed mug/i }));
    const price = screen.getByLabelText(specimenMessagesEn.commerce.priceLabel);
    await user.clear(price);
    await user.type(price, "40");
    await user.click(screen.getByRole("button", { name: specimenMessagesEn.commerce.save }));
    expect(screen.getByRole("status").textContent).toBe(specimenMessagesEn.commerce.saved("Glazed mug"));
  });

  it("shows low-stock badges on short inventory", () => {
    render(<CommerceSpecimen />);
    expect(screen.getByText(specimenMessagesEn.commerce.lowStock(2))).toBeTruthy();
    expect(screen.getByText(specimenMessagesEn.commerce.inStock(6))).toBeTruthy();
  });
});

describe("SaasDashboardSpecimen", () => {
  it("renders usage stats and invites a teammate with a valid email", async () => {
    const user = userEvent.setup();
    const messages = specimenMessagesEn.saasDashboard;
    render(<SaasDashboardSpecimen />);
    expect(screen.getByRole("heading", { name: messages.heading })).toBeTruthy();
    expect(screen.getByText(messages.stats[0]!.label)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: messages.invite }));
    const email = screen.getByLabelText(messages.emailLabel);
    await user.type(email, "dev@example.com");
    await user.click(screen.getByRole("button", { name: messages.send }));
    expect(screen.getByRole("status").textContent).toBe(messages.invitedMessage("dev@example.com"));
    expect(screen.getByText("dev@example.com")).toBeTruthy();
  });

  it("does not invite when the email is invalid", async () => {
    const user = userEvent.setup();
    const messages = specimenMessagesEn.saasDashboard;
    render(<SaasDashboardSpecimen />);
    await user.click(screen.getByRole("button", { name: messages.invite }));
    const send = screen.getByRole("button", { name: messages.send });
    expect(send.hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByLabelText(messages.emailLabel), "not-an-email");
    expect(send.hasAttribute("disabled")).toBe(true);
  });
});

describe("EditorialSpecimen", () => {
  it("publishes and drafts the selected story", async () => {
    const user = userEvent.setup();
    const messages = specimenMessagesEn.editorial;
    render(<EditorialSpecimen />);
    const headline = screen.getByLabelText(messages.headlineLabel);
    await user.clear(headline);
    await user.type(headline, "Updated headline");
    await user.click(screen.getByRole("button", { name: messages.publish }));
    expect(screen.getByRole("status").textContent).toBe(messages.published("Updated headline"));
    await user.click(screen.getByRole("button", { name: messages.saveDraft }));
    expect(screen.getByRole("status").textContent).toBe(messages.drafted("Updated headline"));
  });

  it("switches stories from the queue", async () => {
    const user = userEvent.setup();
    render(<EditorialSpecimen />);
    const second = specimenMessagesEn.editorial.seed[1]!.headline;
    await user.click(screen.getByRole("button", { name: second }));
    expect((screen.getByLabelText(specimenMessagesEn.editorial.headlineLabel) as HTMLInputElement).value).toBe(second);
  });
});

describe("ServiceBookingSpecimen", () => {
  it("books a slot after choosing service and time", async () => {
    const user = userEvent.setup();
    const messages = specimenMessagesEn.serviceBooking;
    render(<ServiceBookingSpecimen />);
    const colour = messages.services[1]!;
    await user.click(screen.getByRole("button", { name: new RegExp(colour.label) }));
    const confirm = screen.getByRole("button", { name: messages.book });
    expect(confirm.hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: messages.slots[0]! }));
    await user.click(confirm);
    expect(screen.getByRole("status").textContent).toBe(messages.booked(colour.label, messages.slots[0]!));
  });

  it("clears the slot when the service changes", async () => {
    const user = userEvent.setup();
    const messages = specimenMessagesEn.serviceBooking;
    render(<ServiceBookingSpecimen />);
    await user.click(screen.getByRole("button", { name: messages.slots[1]! }));
    await user.click(screen.getByRole("button", { name: new RegExp(messages.services[1]!.label) }));
    expect(screen.getByRole("button", { name: messages.book }).hasAttribute("disabled")).toBe(true);
  });
});
