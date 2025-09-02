import { Router } from "express";  
import { createCompetitor , deleteCompetitor} from "../controllers/competitorController";

const router = Router();
router.delete("/competitors/:id", deleteCompetitor );
router.post("/competitors", createCompetitor);


module.exports = router;