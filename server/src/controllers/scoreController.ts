import { Request, Response } from "express";
import {
  setScore,
  updateCompetitorScores,
  fetchScoresByCompetitor,
} from "../models/scoreModel";

// 📝 Judge submits a score
export const submitScore = async (req: Request, res: Response) => {
  try {
    let { judge_id, competitor_id, value } = req.body;

    // force to number
    judge_id = Number(judge_id);
    competitor_id = Number(competitor_id);
    value = Number(value);

    if (!judge_id || !competitor_id || isNaN(value)) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    const score = await setScore(judge_id, competitor_id, value);
    res.status(201).json(score);
  } catch (err) {
    console.error("Error submitting score:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📊 Secretary updates competitor’s scores in bulk
export const updateScores = async (req: Request, res: Response) => {
  try {
    const competitorId = parseInt(req.params.competitorId, 10);
    const { scores } = req.body;

    if (!competitorId || typeof scores !== "object") {
      return res.status(400).json({ error: "Invalid request" });
    }

    await updateCompetitorScores(competitorId, scores);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating scores:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📥 Get all scores for one competitor
export const getScoresByCompetitor = async (req: Request, res: Response) => {
  try {
    const competitorId = parseInt(req.params.competitorId, 10);
    if (!competitorId) {
      return res.status(400).json({ error: "Invalid competitorId" });
    }

    const scores = await fetchScoresByCompetitor(competitorId);
    res.json({ competitor_id: competitorId, scores });
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
