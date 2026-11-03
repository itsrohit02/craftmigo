import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const configPath = fileURLToPath(new URL("../vercel.json", import.meta.url));
const vercelConfig = JSON.parse(readFileSync(configPath, "utf8"));

test("Vercel proxies API and Socket.IO before applying the SPA fallback", () => {
  assert.deepEqual(vercelConfig.headers, [
    {
      source: "/api/(.*)",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
  ]);
  assert.deepEqual(vercelConfig.rewrites.slice(0, 2), [
    {
      source: "/api/:path*",
      destination: "https://craftmigo.onrender.com/api/:path*",
    },
    {
      source: "/socket.io/:path*",
      destination: "https://craftmigo.onrender.com/socket.io/:path*",
    },
  ]);
  assert.deepEqual(vercelConfig.rewrites.at(-1), {
    source: "/(.*)",
    destination: "/index.html",
  });
});
