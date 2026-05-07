import { Sheet } from "../models/sheet.model.js";

export const getSheets = async (req, res) => {
  try {
    const sheets = await Sheet.find().sort({ createdAt: -1 });
    return res.status(200).json({ sheets });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const createSheet = async (req, res) => {
  try {
    const sheet = await Sheet.create({
      name: req.body?.name,
      description: req.body?.description || "",
      status: req.body?.status,
      compteur1: req.body?.compteur1 || "",
      compteur2: req.body?.compteur2 || "",
      assignedCompteurs: req.body?.assignedCompteurs || [],
    });
    return res.status(201).json({ sheet });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const deleteSheet = async (req, res) => {
  try {
    const deleted = await Sheet.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Sheet not found" });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getSheetById = async (req, res) => {
  try {
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: "Sheet not found" });
    return res.status(200).json({ sheet });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const assignCompteur = async (req, res) => {
  const { compteurName } = req.body;
  try {
    const sheet = await Sheet.findById(req.params.id);
    if (!sheet) return res.status(404).json({ message: "Sheet not found" });

    sheet.compteur1 = compteurName || sheet.compteur1;
    if (compteurName) {
      sheet.assignedCompteurs = [...new Set([...(sheet.assignedCompteurs || []), compteurName])];
    }
    await sheet.save();

    return res.status(200).json({ sheet });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

