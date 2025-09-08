import express from "express";
import { showRankings } from "../controllers/rankingController";

const router = express.Router();

router.get("/rankings", showRankings);

export default router;