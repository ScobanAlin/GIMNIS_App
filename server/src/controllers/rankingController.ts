import { Request, Response } from "express";
import { fetchRankings } from "../models/rankingModel";

export const showRankings = async (_req: Request, res: Response) => {
  try {
    const rankings = await fetchRankings();
    res.render("rankings", { rankings });
  } catch (err) {
    console.error("Error fetching rankings:", err);
    res.status(500).send("Internal Server Error");
  }
};