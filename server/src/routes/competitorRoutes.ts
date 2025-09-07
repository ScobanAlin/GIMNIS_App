import { Router } from "express";
import {
  createCompetitor,
  deleteCompetitor,
  getAllcompetitors,
  getCompetitorsByCategory,
} from "../controllers/competitorController";

const router = Router();

router.post("/competitors", createCompetitor);
router.get("/competitors", getAllcompetitors);
router.get("/competitors/by-category", getCompetitorsByCategory);
router.delete("/competitors/:id", deleteCompetitor);

export default router;
