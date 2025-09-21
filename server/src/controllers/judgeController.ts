import { Request, Response } from "express";
import {
  fetchJudgeScores,
  fetchAllScores,
  fetchAllJudges,
  findJudgeById, // 👉 you should add this helper in models
} from "../models/judgeModel";

import { validateCompetitorId, validateScore } from "../utils/validators";

// 📝 Get scores given by a specific judge
export const getJudgeScores = async (req: Request, res: Response) => {
  const judgeId = validateCompetitorId(req.params.id, res); // reuses the same integer check
  if (judgeId === null) return;

  try {
    const judge = await findJudgeById(judgeId);
    if (!judge) {
      return res.status(404).json({ error: "Judge not found" });
    }

    const scores = await fetchJudgeScores(judgeId);
    if (!scores || scores.length === 0) {
      return res.status(404).json({ error: "No scores found for this judge" });
    }

    res.json(scores);
  } catch (error: any) {
    console.error("Error fetching judge scores:", error);
    res.status(500).json({ error: "Failed to fetch judge scores" });
  }
};

// 📊 Get all scores across all judges
export const getAllScores = async (_req: Request, res: Response) => {
  try {
    const scores = await fetchAllScores();
    if (!scores || scores.length === 0) {
      return res.status(404).json({ error: "No scores available" });
    }
    res.json(scores);
  } catch (error: any) {
    console.error("Error fetching all scores:", error);
    res.status(500).json({ error: "Failed to fetch all scores" });
  }
};

// 👨‍⚖️ Get all judges
export const getAllJudges = async (_req: Request, res: Response) => {
  try {
    const judges = await fetchAllJudges();
    if (!judges || judges.length === 0) {
      return res.status(404).json({ error: "No judges found" });
    }
    res.json(judges);
  } catch (error: any) {
    console.error("Error fetching all judges:", error);
    res.status(500).json({ error: "Failed to fetch all judges" });
  }
};
