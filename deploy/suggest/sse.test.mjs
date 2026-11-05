import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyDelta, extractJsonString, inferStage, wantsStream } from "./sse.mjs";

describe("wantsStream", () => {
  it("requires an explicit event-stream accept", () => {
    assert.equal(wantsStream({ headers: { accept: "*/*" } }), false);
    assert.equal(wantsStream({ headers: { accept: "application/json" } }), false);
    assert.equal(wantsStream({ headers: { accept: "text/event-stream" } }), true);
    assert.equal(wantsStream({ headers: { Accept: "text/event-stream, application/json" } }), true);
  });
});

describe("extractJsonString", () => {
  it("reads a summary as the object grows, including escaped quotes", () => {
    assert.equal(extractJsonString('{"summary":'), "");
    assert.equal(extractJsonString('{"summary":"A calm'), "A calm");
    assert.equal(extractJsonString('{"summary":"A calm \\"newsroom\\"."}'), 'A calm "newsroom".');
  });
});

describe("inferStage", () => {
  it("moves from palette through typography to spacing as keys appear", () => {
    assert.equal(inferStage('{"summary":"Hi","tokens":{'), "picking-palette");
    assert.equal(inferStage('{"tokens":{"light":"#111"}'), "picking-palette");
    assert.equal(inferStage('{"tokens":{"light":"#111","fontSans":"Inter"}'), "picking-typography");
    assert.equal(inferStage('{"tokens":{"fontSans":"Inter","spacing":"1rem"}'), "picking-spacing");
  });
});

describe("applyDelta", () => {
  it("emits only new summary characters", () => {
    const first = applyDelta({ raw: "", emitted: "" }, '{"summary":"Quiet ');
    assert.equal(first.added, "Quiet ");
    assert.equal(first.emitted, "Quiet ");
    const second = applyDelta(first, 'newsroom."}');
    assert.equal(second.added, "newsroom.");
    assert.equal(second.emitted, "Quiet newsroom.");
    assert.equal(second.stage, "picking-palette");
  });
});
