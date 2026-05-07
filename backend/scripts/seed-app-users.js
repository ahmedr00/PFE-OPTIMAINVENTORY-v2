import dotenv from "dotenv";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";

dotenv.config();

const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "123456789";
const companyName = "Demo Company";

async function upsertUser({ name, email, role, companyId, password }) {
  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        email,
        role,
        companyId: companyId || null,
        isVerified: true,
        password,
      },
    },
    { returnDocument: "after", upsert: true },
  );
}

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const password = await bcryptjs.hash(defaultPassword, 10);
  const company = await Company.findOneAndUpdate(
    { name: companyName },
    {
      $set: {
        name: companyName,
        legalName: companyName,
      },
    },
    { returnDocument: "after", upsert: true },
  );

  const users = await Promise.all([
    upsertUser({
      name: "Super Admin",
      email: "superadmin@gmail.com",
      role: "SuperAdmin",
      password,
    }),
    upsertUser({
      name: "Romdhani Ahmed Rabiaa",
      email: "romdhaniahmedrabiaa@gmail.com",
      role: "SuperAdmin",
      password,
    }),
    upsertUser({
      name: "Demo Admin",
      email: "admin@gmail.com",
      role: "CompanyOwner",
      companyId: company._id,
      password,
    }),
    upsertUser({
      name: "Demo Counter",
      email: "counter@gmail.com",
      role: "InventoryPersonnel",
      companyId: company._id,
      password,
    }),
  ]);

  console.log(`Company seeded: ${company.name} (${company._id})`);
  for (const user of users) {
    console.log(`User seeded: ${user.email} | ${user.role} | companyId: ${user.companyId || "none"}`);
  }
  console.log(`Default password: ${defaultPassword}`);
}

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
