import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignatureWeb } from "#webhook-web.js";

function sign(secret: Buffer, body: Buffer, timestamp: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.`, "utf8").update(body).digest("hex");
  return `t=${timestamp},v1=${mac}`;
}

const SECRET = Buffer.from("test-secret-32-bytes-long-enough!!");
const BODY = Buffer.from(JSON.stringify({ type: "demo.webhook", data: { text: "hi" } }));
const NOW = Math.floor(Date.now() / 1000).toString();

describe("verifyWebhookSignatureWeb", () => {
  it("accepts a fresh valid signature", async () => {
    await expect(verifyWebhookSignatureWeb(SECRET, sign(SECRET, BODY, NOW), BODY)).resolves.toBe(true);
  });

  it("accepts string secret and body", async () => {
    await expect(
      verifyWebhookSignatureWeb(SECRET.toString("utf8"), sign(SECRET, BODY, NOW), BODY.toString("utf8")),
    ).resolves.toBe(true);
  });

  it("rejects a wrong secret", async () => {
    const other = Buffer.from("wrong-secret-32-bytes-long-enough!!");
    await expect(verifyWebhookSignatureWeb(other, sign(SECRET, BODY, NOW), BODY)).resolves.toBe(false);
  });

  it("rejects an empty secret", async () => {
    await expect(verifyWebhookSignatureWeb("", sign(SECRET, BODY, NOW), BODY)).resolves.toBe(false);
  });

  it("rejects a tampered body", async () => {
    const tampered = Buffer.concat([BODY, Buffer.from("!")]);
    await expect(verifyWebhookSignatureWeb(SECRET, sign(SECRET, BODY, NOW), tampered)).resolves.toBe(false);
  });

  it("rejects an expired timestamp", async () => {
    const old = (Math.floor(Date.now() / 1000) - 3600).toString();
    await expect(verifyWebhookSignatureWeb(SECRET, sign(SECRET, BODY, old), BODY)).resolves.toBe(false);
  });

  it("rejects a far-future timestamp", async () => {
    const future = (Math.floor(Date.now() / 1000) + 3600).toString();
    await expect(verifyWebhookSignatureWeb(SECRET, sign(SECRET, BODY, future), BODY)).resolves.toBe(false);
  });

  it("honors a custom tolerance", async () => {
    const old = (Math.floor(Date.now() / 1000) - 3600).toString();
    await expect(
      verifyWebhookSignatureWeb(SECRET, sign(SECRET, BODY, old), BODY, { toleranceSeconds: 7200 }),
    ).resolves.toBe(true);
  });

  it.each([[undefined], [""], ["t=abc,v1=zz"], ["v1=ab"], [`t=${NOW},v1=abc`]])(
    "rejects malformed header %j",
    async (header) => {
      await expect(verifyWebhookSignatureWeb(SECRET, header, BODY)).resolves.toBe(false);
    },
  );
});
