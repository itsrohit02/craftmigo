import test from "node:test";
import assert from "node:assert/strict";
import {
  isWorkerBookable,
  setUserBlocked,
} from "../src/services/workerAccess.service.js";

test("blocking a worker denies access before updating the profile", async () => {
  const operations = [];
  const user = {
    _id: "worker-1",
    role: "worker",
    isBlocked: false,
    async save() {
      operations.push(`user:${this.isBlocked}`);
    },
  };

  await setUserBlocked(user, true, async (_userId, blocked) => {
    operations.push(`profile:${blocked}`);
  });

  assert.equal(user.isBlocked, true);
  assert.deepEqual(operations, ["user:true", "profile:true"]);
});

test("unblocking a worker updates the profile before restoring account access", async () => {
  const operations = [];
  const user = {
    _id: "worker-1",
    role: "worker",
    isBlocked: true,
    async save() {
      operations.push(`user:${this.isBlocked}`);
    },
  };

  await setUserBlocked(user, false, async (_userId, blocked) => {
    operations.push(`profile:${blocked}`);
  });

  assert.equal(user.isBlocked, false);
  assert.deepEqual(operations, ["profile:false", "user:false"]);
});

test("blocking a non-worker does not touch worker profiles", async () => {
  let profileUpdated = false;
  const user = {
    _id: "customer-1",
    role: "user",
    isBlocked: false,
    async save() {},
  };

  await setUserBlocked(user, true, async () => {
    profileUpdated = true;
  });

  assert.equal(user.isBlocked, true);
  assert.equal(profileUpdated, false);
});

test("booking eligibility rejects blocked and unavailable workers", () => {
  const profile = {
    isBlocked: false,
    isSetupComplete: true,
    verificationStatus: "verified",
    isAvailable: true,
  };
  const user = { role: "worker", isBlocked: false, isActive: true };

  assert.equal(isWorkerBookable(profile, user), true);
  assert.equal(isWorkerBookable(profile, { ...user, isBlocked: true }), false);
  assert.equal(isWorkerBookable({ ...profile, isBlocked: true }, user), false);
  assert.equal(isWorkerBookable({ ...profile, isAvailable: false }, user), false);
  assert.equal(isWorkerBookable({ ...profile, verificationStatus: "pending" }, user), false);
});
