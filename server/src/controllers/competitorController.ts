import { Request, Response } from "express";
import { insertCompetitor , deleteCompetitorById } from "../models/competitorModel";

export const createCompetitor = async (req: Request, res: Response) => {
    const { first_name, last_name, email, category, age, club } = req.body;
    if (!first_name || !last_name || !email || !category || age === undefined || !club) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof age !== "number" || age < 0) {
        return res.status(400).json({ error: "Age must be a non-negative number" });
    }
    try {
        const newCompetitor = await insertCompetitor(first_name, last_name, email, category, age, club);
        res.status(201).json(newCompetitor);
    } catch (error: any) {
        if (error.code === "23505") { // Unique violation
            res.status(409).json({ error: "Email already exists" });
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
}
export const deleteCompetitor = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10); 
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid competitor ID" });
    }   
    try {
        const deletedCompetitor = await deleteCompetitorById(id);
        if (!deletedCompetitor) {
            return res.status(404).json({ error: "Competitor not found" });
        }
        res.status(200).json(deletedCompetitor);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}