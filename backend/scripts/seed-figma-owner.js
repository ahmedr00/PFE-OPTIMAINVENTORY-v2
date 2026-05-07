import dotenv from "dotenv";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import { Article } from "../models/article.model.js";
import { Company } from "../models/company.model.js";
import { ComparisonResult } from "../models/comparison.model.js";
import { Inventory } from "../models/inventory.model.js";
import { TechnicalInventory } from "../models/technicalInventory.model.js";
import { User } from "../models/user.model.js";
import { Warehouse } from "../models/warehouse.model.js";

dotenv.config();

const email = "figmaowenr@gmail.com";
const defaultPassword = "figmaowner123";

const warehouseSeeds = [
  {
    name: "Central Warehouse",
    location: "Tunis distribution hub",
    latitude: 36.8065,
    longitude: 10.1815,
    articles: [
      { code: "FIG-001", name: "Laptop Pro 14", barcode: "619000000001", location: "A-01", category: "IT", unit: "pcs", unitPrice: 2400, theoreticalQuantity: 12 },
      { code: "FIG-002", name: "Wireless Scanner", barcode: "619000000002", location: "A-02", category: "Equipment", unit: "pcs", unitPrice: 280, theoreticalQuantity: 18 },
      { code: "FIG-003", name: "Thermal Labels", barcode: "619000000003", location: "B-01", category: "Consumables", unit: "roll", unitPrice: 18, theoreticalQuantity: 120 },
    ],
  },
  {
    name: "North Stockroom",
    location: "Ariana reserve stock",
    latitude: 36.8665,
    longitude: 10.1647,
    articles: [
      { code: "FIG-101", name: "Barcode Printer", barcode: "619000000101", location: "C-01", category: "Equipment", unit: "pcs", unitPrice: 650, theoreticalQuantity: 6 },
      { code: "FIG-102", name: "Safety Gloves", barcode: "619000000102", location: "D-02", category: "Safety", unit: "box", unitPrice: 35, theoreticalQuantity: 45 },
      { code: "FIG-103", name: "Inventory Tags", barcode: "619000000103", location: "D-03", category: "Consumables", unit: "pack", unitPrice: 12, theoreticalQuantity: 200 },
    ],
  },
];

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  let company = await Company.findOne({ name: "Figma Owner Demo Company" });
  if (!company) {
    company = await Company.create({
      name: "Figma Owner Demo Company",
      legalName: "Figma Owner Demo Company",
    });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: "Figma Owner",
      email,
      role: "CompanyOwner",
      companyId: company._id,
      password: await bcryptjs.hash(defaultPassword, 10),
      isVerified: true,
    });
  } else {
    user.name = user.name || "Figma Owner";
    user.role = "CompanyOwner";
    user.companyId = user.companyId || company._id;
    await user.save();
    company = await Company.findById(user.companyId) || company;
  }

  let warehouseCount = 0;
  let articleCount = 0;
  let primaryWarehouse = null;
  const seededArticles = [];
  for (const warehouseSeed of warehouseSeeds) {
    const warehouse = await Warehouse.findOneAndUpdate(
      { companyId: company._id, name: warehouseSeed.name },
      {
        $set: {
          companyId: company._id,
          name: warehouseSeed.name,
          location: warehouseSeed.location,
          latitude: warehouseSeed.latitude,
          longitude: warehouseSeed.longitude,
        },
      },
      { new: true, upsert: true },
    );
    if (!primaryWarehouse) primaryWarehouse = warehouse;
    warehouseCount += 1;

    for (const article of warehouseSeed.articles) {
      const savedArticle = await Article.findOneAndUpdate(
        { warehouseId: warehouse._id, code: article.code },
        {
          $set: {
            ...article,
            reference: article.code,
            warehouseId: warehouse._id,
            companyId: company._id,
            stock: article.theoreticalQuantity,
            active: true,
          },
        },
        { new: true, upsert: true },
      );
      if (warehouse._id.equals(primaryWarehouse._id)) seededArticles.push(savedArticle);
      articleCount += 1;
    }
  }

  const counter = await User.findOneAndUpdate(
    { email: "figma.counter@gmail.com" },
    {
      $set: {
        name: "Figma Counter",
        email: "figma.counter@gmail.com",
        role: "InventoryPersonnel",
        companyId: company._id,
        isVerified: true,
      },
      $setOnInsert: {
        password: await bcryptjs.hash("counter123", 10),
      },
    },
    { new: true, upsert: true },
  );

  const inventory = await Inventory.findOneAndUpdate(
    { companyId: company._id, name: "INV105" },
    {
      $set: {
        companyId: company._id,
        warehouseId: primaryWarehouse._id,
        name: "INV105",
        status: "In Progress",
        assignedCounterId: counter._id,
      },
    },
    { new: true, upsert: true },
  );

  const comparisonSeeds = [
    { technicalQty: 12, finalQty: 12, count1Qty: 12 },
    { technicalQty: 18, finalQty: 15, count1Qty: 15 },
    { technicalQty: 120, finalQty: 128, count1Qty: 128 },
  ];
  let comparisonCount = 0;
  for (const [index, article] of seededArticles.entries()) {
    const comparison = comparisonSeeds[index] || {
      technicalQty: article.theoreticalQuantity || article.stock || 0,
      finalQty: article.theoreticalQuantity || article.stock || 0,
      count1Qty: article.theoreticalQuantity || article.stock || 0,
    };
    await ComparisonResult.findOneAndUpdate(
      { inventoryId: inventory._id, articleId: article._id },
      {
        $set: {
          inventoryId: inventory._id,
          articleId: article._id,
          ...comparison,
          count2Qty: 0,
          count3Qty: 0,
        },
      },
      { upsert: true },
    );
    comparisonCount += 1;
  }

  await TechnicalInventory.findOneAndUpdate(
    { inventoryId: inventory._id },
    {
      $set: {
        inventoryId: inventory._id,
        uploadedFile: "INV105-technical.csv",
        originalName: "INV105-technical.csv",
        rowCount: comparisonCount,
        matchedRows: comparisonCount,
        uploadedAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log(`Seeded ${email}`);
  console.log(`Company: ${company.name} (${company._id})`);
  console.log(`User: ${user.email} (${user._id})`);
  console.log(`Warehouses upserted: ${warehouseCount}`);
  console.log(`Articles upserted: ${articleCount}`);
  console.log(`Inventory seeded: ${inventory.name} (${inventory._id})`);
  console.log(`Comparisons upserted: ${comparisonCount}`);
  console.log(`Default password for newly created user: ${defaultPassword}`);
}

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
