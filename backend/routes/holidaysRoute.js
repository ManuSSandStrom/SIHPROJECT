import { Router } from "express";
import Holiday from "../models/Holiday.js";

export const holidaysRouter = Router();

holidaysRouter.get("/", async (req, res) => {
  try {
    const { department, section } = req.query;
    const query = {};
    if (department) {
      query.$or = [{ department }, { department: "All Departments" }];
    }
    if (section) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ section }, { section: "All Sections" }] });
    }
    const holidays = await Holiday.find(query).sort({ date: -1, createdAt: -1 });
    res.json(holidays);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ error: "Failed to fetch holidays" });
  }
});

holidaysRouter.post("/", async (req, res) => {
  try {
    const holiday = await Holiday.create(req.body);
    res.status(201).json(holiday);
  } catch (error) {
    console.error("Error creating holiday:", error);
    res.status(500).json({ error: "Failed to create holiday" });
  }
});
