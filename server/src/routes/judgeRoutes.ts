import { Router } from "express";
import { getJudgeScores, getAllScores } from "../controllers/judgeController";

const router = Router();

// Get all scores given by a specific judge
router.get("/judges/:id/scores", getJudgeScores);

// Get all scores (all judges, all competitors)
router.get("/scores", getAllScores);

export default router;
