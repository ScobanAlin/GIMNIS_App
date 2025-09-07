import { Router } from "express";
import { updateScores, submitScore, getScoresByCompetitor } from "../controllers/scoreController";

const router = Router();

// Submit or update a score for a competitor
router.post("/scores", submitScore);

// Bulk update by secretary (spreadsheet-like view)
router.put("/scores/:competitorId", updateScores);

// Get all scores for one competitor (with judges)
router.get("/scores/:competitorId", getScoresByCompetitor);

export default router;
