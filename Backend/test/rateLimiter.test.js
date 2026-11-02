import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createServer } from "node:http";
import {
  createRateLimiter,
  createTokenBucketLimiter,
} from "../src/middlewares/rateLimiter.js";

const listen = async (server) => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  return `http://127.0.0.1:${server.address().port}`;
};

const close = async (server) => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
};

test("token bucket allows its capacity and rejects excess requests per IP", () => {
  const limiter = createTokenBucketLimiter({ capacity: 2, refillIntervalMs: 2_000 });

  assert.equal(callLimiter(limiter, "198.51.100.10").nextCalled, true);
  assert.equal(callLimiter(limiter, "198.51.100.10").nextCalled, true);

  const limited = callLimiter(limiter, "198.51.100.10");
  assert.equal(limited.response.statusCode, 429);
  assert.equal(limited.response.headers["RateLimit-Remaining"], "0");
  assert.equal(limited.response.headers["Retry-After"], "2");
  assert.equal(limited.nextCalled, false);
  assert.equal(callLimiter(limiter, "198.51.100.11").nextCalled, true);
});

test("token bucket replenishes one token for each refill interval", () => {
  const limiter = createTokenBucketLimiter({ capacity: 1, refillIntervalMs: 2_000 });
  const originalNow = Date.now;
  let now = 10_000;
  Date.now = () => now;

  try {
    assert.equal(callLimiter(limiter, "198.51.100.12").nextCalled, true);
    assert.equal(callLimiter(limiter, "198.51.100.12").response.statusCode, 429);

    now += 1_999;
    assert.equal(callLimiter(limiter, "198.51.100.12").response.statusCode, 429);

    now += 1;
    assert.equal(callLimiter(limiter, "198.51.100.12").nextCalled, true);
  } finally {
    Date.now = originalNow;
  }
});

test("express-rate-limit enforces its in-memory fixed-window limit", async () => {
  const app = express();
  app.use(createRateLimiter(60_000, 2));
  app.get("/", (_req, res) => res.status(200).json({ success: true }));

  const server = createServer(app);
  const baseUrl = await listen(server);

  try {
    const first = await fetch(baseUrl);
    const second = await fetch(baseUrl);
    const third = await fetch(baseUrl);

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
    assert.match(third.headers.get("ratelimit") ?? "", /"2-in-1min"/);
    assert.deepEqual(await third.json(), {
      success: false,
      message: "Too many requests. Please try again later.",
    });
  } finally {
    await close(server);
  }
});

const callLimiter = (limiter, ip) => {
  const response = {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  limiter({ ip }, response, (error) => {
    assert.equal(error, undefined);
    nextCalled = true;
  });
  return { response, nextCalled };
};
