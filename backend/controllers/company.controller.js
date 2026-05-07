import { Company } from "../models/company.model.js";
import { Warehouse } from "../models/warehouse.model.js";

const requireSuperAdmin = (req, res) => {
  if (req.user?.role !== "SuperAdmin") {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
};

// Create a new Company (Logic for Super Admin)
export const createCompany = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { name, legalName } = req.body;
    const newCompany = new Company({ name, legalName });
    const savedCompany = await newCompany.save();
    res.status(201).json(savedCompany);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating company", error: err.message });
  }
};

// Get all companies (For Super Admin dashboard)
export const getAllCompanies = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single company details
export const getCompanyById = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update company info (legal name, etc.)
export const updateCompany = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json(updatedCompany);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all warehouses belonging to a company
export const getCompanyWarehouses = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    // This uses the companyId (FK) defined in your Warehouse model
    const warehouses = await Warehouse.find({ companyId: req.params.id });
    res.status(200).json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a company
export const deleteCompany = async (req, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    await Company.findByIdAndDelete(req.params.id);
    // Note: You might want to delete associated Warehouses and Articles here (Cascading)
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
