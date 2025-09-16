import { Router } from "express";
import { getJudgeScores, getAllScores , getAllJudges} from "../controllers/judgeController";
import { get } from "http";

const router = Router();

// Get all scores given by a specific judge
router.get("/judges/:id/scores", getJudgeScores);

// Get all scores (all judges, all competitors)
router.get("/scores", getAllScores);
router.get("/judges", getAllJudges);
export default router;
