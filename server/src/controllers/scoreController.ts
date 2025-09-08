import { Request, Response } from "express";
import { setScore, fetchScoresByCompetitor } from "../models/scoreModel";

// 📝 Judge submits or updates a single score
export const submitScore = async (req: Request, res: Response) => {
  try {
    console.log("REQ BODY:", req.body);

    let { judge_id, competitor_id, value } = req.body;

    judge_id = Number(judge_id);
    competitor_id = Number(competitor_id);
    value = Number(value);

    if (!judge_id || !competitor_id || isNaN(value)) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    const score = await setScore(judge_id, competitor_id, value);

    res.status(201).json({
      success: true,
      message: "Score updated",
      score,
    });
  } catch (err) {
    console.error("Error submitting score:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 📥 Get all scores for one competitor (with judge_ids)
export const getScoresByCompetitor = async (req: Request, res: Response) => {
  try {
    const competitorId = parseInt(req.params.competitorId, 10);
    if (!competitorId) {
      return res.status(400).json({ error: "Invalid competitorId" });
    }

    const rows = await fetchScoresByCompetitor(competitorId);

    const scores: Record<string, number | null> = {};
    const judge_ids: Record<string, number> = {};

    rows.forEach((row) => {
      scores[row.judge_name] = row.value ?? null;
      judge_ids[row.judge_name] = row.judge_id;
    });

    res.json({
      competitor_id: competitorId,
      scores,
      judge_ids,
    });
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
