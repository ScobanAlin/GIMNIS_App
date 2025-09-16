// src/controllers/voteController.ts
import { Request, Response } from "express";
import { setCurrentVote, clearVote, fetchCurrentVote } from "../models/voteModel";

export const startVote = async (req: Request, res: Response) => {
  try {
    const { competitor_id } = req.body;
    if (!competitor_id) {
      return res.status(400).json({ error: "competitor_id is required" });
    }

    await setCurrentVote(competitor_id);
    res.json({ success: true, competitor_id });
  } catch (err) {
    console.error("Error starting vote:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const stopVote = async (_req: Request, res: Response) => {
  try {
    await clearVote();
    res.json({ success: true, message: "Vote stopped" });
  } catch (err) {
    console.error("Error stopping vote:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCurrentVote = async (req: Request, res: Response) => {
  try {
    const judgeId = req.query.judge_id
      ? parseInt(req.query.judge_id as string, 10)
      : undefined;

    const vote = await fetchCurrentVote(judgeId);
    res.json(vote || { competitor_id: null });
  } catch (err) {
    console.error("Error fetching current vote:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};