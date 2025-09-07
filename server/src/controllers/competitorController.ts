import { Request, Response } from "express";
import {
  insertCompetitor,
  deleteCompetitorById,
  getAllCompetitors,
  fetchCompetitorsWithScores,
} from "../models/competitorModel";

export const createCompetitor = async (req: Request, res: Response) => {
  const { name, category, club, members } = req.body;
  if (!name || !category || !club || !Array.isArray(members)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const newCompetitor = await insertCompetitor(name, category, club, members);
    res.status(201).json(newCompetitor);
  } catch (err: any) {
    console.error("Error creating competitor:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCompetitor = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid competitor ID" });

  try {
    const deleted = await deleteCompetitorById(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllcompetitors = async (_req: Request, res: Response) => {
  try {
    const competitors = await getAllCompetitors();
    res.json(competitors);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCompetitorsByCategory = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    if (!category) return res.status(400).json({ error: "Category required" });

    const competitors = await fetchCompetitorsWithScores(category);
    res.json(competitors);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
