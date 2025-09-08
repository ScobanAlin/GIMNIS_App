import { Router } from "express";
import { submitScore, getScoresByCompetitor } from "../controllers/scoreController";

const router = Router();

// Submit or update a score for a competitor
router.post("/scores", submitScore);

// Get all scores for one competitor (with judges + ids)
router.get("/scores/:competitorId", getScoresByCompetitor);

export default router;
