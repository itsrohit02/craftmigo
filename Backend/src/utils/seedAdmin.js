/**
 * Create the platform admin account from backend environment variables.
 * Admin CANNOT be created via the public /api/auth/register endpoint.
 *
 * Usage:
 *   Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in Backend/.env,
 *   then run: node src/utils/seedAdmin.js
 *
 * If an admin already exists, this updates its email to ADMIN_EMAIL without
 * changing its password, so password changes persist when the script is rerun.
 */
import "../config/env.js";

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";

const run = async () => {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!email) {
    console.error("Set ADMIN_EMAIL in Backend/.env");
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOne({ role: "admin" });
  const emailOwner = await User.findOne({ email });
  if (emailOwner && (!admin || !emailOwner._id.equals(admin._id))) {
    console.error("ADMIN_EMAIL is already in use by a non-admin account. Aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }

  if (admin) {
    admin.email = email;
    if (name) admin.name = name;
    await admin.save();
    console.log(`Admin account email set to ${email}; existing password was not changed.`);
  } else {
    if (!password) {
      console.error("Set ADMIN_INITIAL_PASSWORD in Backend/.env to create the admin account.");
      await mongoose.disconnect();
      process.exit(1);
    }
    await User.create({ name: name || "CraftMIgo Admin", email, password, role: "admin" });
    console.log(`Admin account created for ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run();
