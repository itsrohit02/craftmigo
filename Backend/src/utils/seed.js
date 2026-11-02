/**
 * Development seed script.
 * Populates categories, test customers, test workers (with completed,
 * verified profiles), and a handful of services so the app is usable
 * immediately without manually clicking through setup/verification.
 *
 * This does NOT create an admin account — admin accounts are created
 * only via seedAdmin.js, per the rule that admin can never self-register.
 *
 * Usage:
 *   node src/utils/seed.js
 *
 * Safe to re-run: it upserts categories and replaces the specific seed
 * users/services it owns (matched by email), without touching any other
 * data in the database.
 */
import "../config/env.js";

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import WorkerProfile from "../models/workerProfile.model.js";
import Category from "../models/category.model.js";
import Service from "../models/service.model.js";

const CATEGORIES = [
  { name: "Plumbing", icon: "droplets", description: "Leak repairs, pipe fitting, fixture installation" },
  { name: "Electrical", icon: "zap", description: "Wiring, switchboards, appliance installation" },
  { name: "Carpentry", icon: "hammer", description: "Furniture repair, woodwork, fittings" },
  { name: "Painting", icon: "paintbrush", description: "Interior and exterior painting" },
  { name: "Cleaning", icon: "sparkles", description: "Home and office deep cleaning" },
  { name: "AC Repair", icon: "wind", description: "AC servicing, installation, and repair" },
  { name: "Labour", icon: "hard-hat", description: "General labour and physical assistance" },
  { name: "Other", icon: "briefcase", description: "A service category not listed above" },
];

const SEED_CUSTOMERS = [
  { name: "Aarav Sharma", email: "customer1@craftmigo.dev", password: "password123", phone: "9000000001" },
  { name: "Priya Verma", email: "customer2@craftmigo.dev", password: "password123", phone: "9000000002" },
];

const SEED_WORKERS = [
  {
    name: "Ramesh Kumar",
    email: "worker1@craftmigo.dev",
    password: "password123",
    phone: "9000000011",
    categoryNames: ["Plumbing"],
    bio: "10+ years fixing leaks, installing fixtures, and handling pipe repairs across Jaipur.",
    skills: ["pipe fitting", "leak repair", "bathroom fitting"],
    serviceAreas: ["Vaishali Nagar", "Malviya Nagar"],
    experienceYears: 10,
    services: [
      {
        title: "Tap & Pipe Leak Repair",
        description: "Quick diagnosis and repair of leaking taps, pipes, and joints. Includes minor part replacement.",
        pricingType: "hourly",
        amount: 300,
        durationMinutes: 60,
        tags: ["leak", "tap", "pipe"],
      },
      {
        title: "Bathroom Fitting Installation",
        description: "Installation of wash basins, faucets, showers, and other bathroom fittings.",
        pricingType: "daily",
        amount: 1500,
        durationMinutes: 240,
        tags: ["bathroom", "installation"],
      },
    ],
  },
  {
    name: "Suresh Yadav",
    email: "worker2@craftmigo.dev",
    password: "password123",
    phone: "9000000012",
    categoryNames: ["Electrical"],
    bio: "Licensed electrician specializing in home wiring, switchboard upgrades, and appliance installs.",
    skills: ["wiring", "switchboard repair", "appliance installation"],
    serviceAreas: ["C-Scheme", "Raja Park"],
    experienceYears: 7,
    services: [
      {
        title: "Switchboard & Wiring Repair",
        description: "Diagnosis and repair of faulty switchboards, short circuits, and home wiring issues.",
        pricingType: "hourly",
        amount: 350,
        durationMinutes: 60,
        tags: ["wiring", "electrical"],
      },
    ],
  },
  {
    name: "Meena Devi",
    email: "worker3@craftmigo.dev",
    password: "password123",
    phone: "9000000013",
    categoryNames: ["Cleaning"],
    bio: "Professional deep-cleaning service for homes and offices, using eco-friendly products.",
    skills: ["deep cleaning", "sofa cleaning", "kitchen cleaning"],
    serviceAreas: ["Mansarovar", "Vaishali Nagar"],
    experienceYears: 5,
    services: [
      {
        title: "Full Home Deep Cleaning",
        description: "Complete deep cleaning of kitchen, bathrooms, floors, and living areas.",
        pricingType: "daily",
        amount: 1200,
        durationMinutes: 300,
        tags: ["cleaning", "home"],
      },
    ],
  },
];

const run = async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed script cannot run in production");
  }

  await connectDB();

  console.log("Seeding categories...");
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: cat.name },
      { $set: cat },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap[cat.name] = doc._id;
  }
  console.log(`  ${Object.keys(categoryMap).length} categories ready`);

  console.log("Seeding customers...");
  for (const c of SEED_CUSTOMERS) {
    await User.findOneAndDelete({ email: c.email });
    await User.create({ ...c, role: "user" });
  }
  console.log(`  ${SEED_CUSTOMERS.length} customers created`);

  console.log("Seeding workers...");
  let serviceCount = 0;
  for (const w of SEED_WORKERS) {
    await User.findOneAndDelete({ email: w.email });
    const user = await User.create({
      name: w.name,
      email: w.email,
      password: w.password,
      phone: w.phone,
      role: "worker",
    });

    await WorkerProfile.findOneAndDelete({ user: user._id });
    await WorkerProfile.create({
      user: user._id,
      bio: w.bio,
      skills: w.skills,
      categories: w.categoryNames.map((n) => categoryMap[n]),
      serviceAreas: w.serviceAreas,
      experienceYears: w.experienceYears,
      isAvailable: true,
      isSetupComplete: true,
      verificationStatus: "verified",
    });

    for (const s of w.services) {
      await Service.create({
        worker: user._id,
        category: categoryMap[w.categoryNames[0]],
        title: s.title,
        description: s.description,
        pricing: { type: s.pricingType, amount: s.amount },
        durationMinutes: s.durationMinutes,
        tags: s.tags,
        images: [],
      });
      serviceCount += 1;
    }
  }
  console.log(`  ${SEED_WORKERS.length} workers created, ${serviceCount} services created`);

  console.log("\nSeed complete. Test accounts (all use password: password123):");
  SEED_CUSTOMERS.forEach((c) => console.log(`  Customer: ${c.email}`));
  SEED_WORKERS.forEach((w) => console.log(`  Worker:   ${w.email}`));
  console.log("\nCreate an admin separately with:");
  console.log("  Set ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD in Backend/.env, then run node src/utils/seedAdmin.js");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
