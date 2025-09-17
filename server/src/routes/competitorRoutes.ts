import { Router } from "express";
import {
  createCompetitor,
  deleteCompetitor,
  getAllcompetitors,
  getCompetitorsByCategory,
  validateCompetitor,
  unvalidateCompetitor,  // 👈 add this

} from "../controllers/competitorController";

const router = Router();

router.post("/competitors", createCompetitor);
router.get("/competitors", getAllcompetitors);
router.get("/competitors/by-category", getCompetitorsByCategory);
router.delete("/competitors/:id", deleteCompetitor);
router.post("/scores/:id/validate", validateCompetitor);
router.delete("/scores/:id/unvalidate", unvalidateCompetitor); // 👈 new route


export default router;
