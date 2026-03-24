import { Router } from "express";
import Feedback from "../models/Feedback.js";

export const feedbackRouter = Router();

feedbackRouter.get("/", async (req, res) => {
  try {
    const { status, lecturerId } = req.query;
    const query = status ? { status } : {};
    if (lecturerId) {
      query.lecturerId = lecturerId;
    }
    const feedback = await Feedback.find(query).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

feedbackRouter.post("/", async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.status(201).json(feedback);
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ error: "Failed to create feedback" });
  }
});

feedbackRouter.put("/:id", async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }
    res.json(feedback);
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "Failed to update feedback" });
  }
});
