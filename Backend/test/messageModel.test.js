import test from "node:test";
import assert from "node:assert/strict";
import Message from "../src/models/message.model.js";

test("message schema accepts 299 characters and rejects 300", () => {
  const base = {
    conversation: "507f1f77bcf86cd799439011",
    sender: "507f1f77bcf86cd799439012",
  };
  const valid = new Message({ ...base, text: "a".repeat(299) });
  const invalid = new Message({ ...base, text: "a".repeat(300) });

  assert.equal(valid.validateSync(), undefined);
  assert.match(invalid.validateSync().errors.text.message, /299 characters/);
});
