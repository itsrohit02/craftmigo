import test from "node:test";
import assert from "node:assert/strict";
import {
  getSocketBaseUrl,
  resolveApiBaseUrl,
} from "../src/config/apiUrl.js";

test("API URL validation requires a valid API base URL", () => {
  assert.throws(() => resolveApiBaseUrl("", { isProduction: true }), /must be set/);
  assert.throws(
    () => resolveApiBaseUrl("http://localhost:5000/api", { isProduction: true }),
    /must use HTTPS/
  );
  assert.throws(
    () => resolveApiBaseUrl("https://api.example.com", { isProduction: true }),
    /ending in \/api/
  );
  assert.equal(
    resolveApiBaseUrl("https://api.example.com/api/", { isProduction: true }),
    "https://api.example.com/api"
  );
  assert.equal(resolveApiBaseUrl("/api", { isProduction: true }), "/api");
  assert.equal(resolveApiBaseUrl("/api/", { isProduction: true }), "/api");
  assert.throws(
    () => resolveApiBaseUrl("//attacker.example/api", { isProduction: true }),
    /absolute backend API URL/
  );
});

test("chat socket URL is derived from the configured API URL", () => {
  assert.equal(
    getSocketBaseUrl("https://api.example.com/api"),
    "https://api.example.com"
  );
  assert.equal(
    getSocketBaseUrl("/api", "https://craftmigo.vercel.app"),
    "https://craftmigo.vercel.app"
  );
});
