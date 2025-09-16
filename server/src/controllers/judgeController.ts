import { Request, Response } from "express";
import { fetchJudgeScores, fetchAllScores , fetchAllJudges} from "../models/judgeModel";

// 📝 Get scores given by a specific judge
export const getJudgeScores = async (req: Request, res: Response) => {
  const { id } = req.params;
  const judgeId = Number(id);

  if (!Number.isInteger(judgeId) || judgeId <= 0) {
    return res.status(400).json({ error: "Invalid judge ID" });
  }

  try {
    const scores = await fetchJudgeScores(judgeId);
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
    res.json(scores);
  } catch (error: any) {
    console.error("Error fetching all scores:", error);
    res.status(500).json({ error: "Failed to fetch all scores" });
  }
};

export const getAllJudges = async (_req: Request, res: Response) => {
  try {
    const judges = await fetchAllJudges();
    res.json(judges);
  } catch (error: any) {
    console.error("Error fetching all judges:", error);
    res.status(500).json({ error: "Failed to fetch all judges" });
  }
};